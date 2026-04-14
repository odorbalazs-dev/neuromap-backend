import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

const ALLOWED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function getSafeLang(lang) {
  if (!lang) return "hu";
  return ALLOWED_LANGS.includes(lang) ? lang : "hu";
}

function getSuccessUrl(lang) {
  const safeLang = getSafeLang(lang);
  return `https://neuromap-kids.webflow.io/${safeLang}-checkout-success?session_id={CHECKOUT_SESSION_ID}`;
}

function getCancelUrl(lang) {
  const safeLang = getSafeLang(lang);
  return `https://neuromap-kids.webflow.io/${safeLang}-checkout-cancel`;
}
}

function getProductName(lang) {
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

  return names[lang] || names.hu;
}

export async function createCheckoutSession({
  internalSessionId,
  email,
  name,
  lang,
  payload
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
          currency: "usd",
          product_data: {
            name: getProductName(safeLang)
          },
          unit_amount: 200
        },
        quantity: 1
      }
    ],

    success_url: getSuccessUrl(safeLang),
    cancel_url: getCancelUrl(safeLang),

    metadata: {
      internalSessionId,
      email,
      name: name || "",
      lang: safeLang,
      payload: JSON.stringify(payload || {})
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