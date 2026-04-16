import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function getSafeLang(lang) {
  if (!lang) return "en";
  return SUPPORTED_LANGS.includes(lang) ? lang : "en";
}

function getStripeCheckoutLocale(lang) {
  const safeLang = getSafeLang(lang);

  const localeMap = {
    hu: "hu",
    en: "en",
    de: "de",
    it: "it",
    es: "es",
    zh: "zh",
    ja: "ja",
    pl: "pl",
    pt: "pt",
    fr: "fr",
    ar: "en"
  };

  return localeMap[safeLang] || "en";
}

function getWebBaseUrl() {
  return (
    env.APP_BASE_URL ||
    env.WEBFLOW_BASE_URL ||
    "https://neuromap-kids.webflow.io"
  );
}

function getSuccessUrl(lang) {
  const safeLang = getSafeLang(lang);
  const base = getWebBaseUrl();
  return `${base}/${safeLang}-checkout-success?session_id={CHECKOUT_SESSION_ID}`;
}

function getCancelUrl(lang) {
  const safeLang = getSafeLang(lang);
  const base = getWebBaseUrl();
  return `${base}/${safeLang}-checkout-cancel`;
}

function getProductName(lang) {
  const safeLang = getSafeLang(lang);

  const names = {
    hu: "NeuroMap Kids – AI kiértékelés",
    en: "NeuroMap Kids – AI Assessment",
    de: "NeuroMap Kids – KI-Auswertung",
    it: "NeuroMap Kids – Valutazione AI",
    es: "NeuroMap Kids – Evaluación con IA",
    zh: "NeuroMap Kids – AI 评估",
    ja: "NeuroMap Kids – AI評価",
    ar: "NeuroMap Kids – تقييم بالذكاء الاصطناعي",
    pl: "NeuroMap Kids – Ocena AI",
    pt: "NeuroMap Kids – Avaliação por IA",
    fr: "NeuroMap Kids – Évaluation IA"
  };

  return names[safeLang] || names.en;
}

export async function createCheckoutSession({
  internalSessionId,
  email,
  name,
  lang
}) {
  if (!internalSessionId) {
    throw new Error("Missing internalSessionId for Stripe checkout session.");
  }

  if (!email) {
    throw new Error("Missing email for Stripe checkout session.");
  }

  const safeLang = getSafeLang(lang);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,

    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: getProductName(safeLang)
          },
          unit_amount: 4900
        },
        quantity: 1
      }
    ],

    locale: getStripeCheckoutLocale(safeLang),

    success_url: getSuccessUrl(safeLang),
    cancel_url: getCancelUrl(safeLang),

    metadata: {
      internalSessionId,
      email,
      name: name || "",
      lang: safeLang
    }
  });

  return session;
}

export function constructStripeEvent(rawBody, signature) {
  if (!signature) {
    throw new Error("Missing Stripe signature header.");
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}