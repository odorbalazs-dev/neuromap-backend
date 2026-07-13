import Stripe from "stripe";
import { env } from "../config/env.js";
import { getProductPackage } from "../config/products.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

const CHECKOUT_COPY = {
  hu: {
    standardName: "NeuroMap Kids Standard riport",
    standardDescription: "Személyre szabott, korosztályra finomított PDF riport szülői javaslatokkal.",
    plusName: "NeuroMap Kids Plus riport és 14 napos megfigyelés",
    plusDescription: "Standard riport, megosztható összefoglaló, helyzettervek, beszélgetési útmutató és 14 napos megfigyelési napló."
  },
  en: {
    standardName: "NeuroMap Kids Standard report",
    standardDescription: "A personalized, age-aware PDF report with practical guidance for parents.",
    plusName: "NeuroMap Kids Plus report and 14-day observation",
    plusDescription: "Standard report, shareable summary, situation plans, conversation guide, and a 14-day observation diary."
  },
  de: {
    standardName: "NeuroMap Kids Standard-Bericht",
    standardDescription: "Personalisierter, altersgerechter PDF-Bericht mit praktischen Hinweisen für Eltern.",
    plusName: "NeuroMap Kids Plus-Bericht und 14-Tage-Beobachtung",
    plusDescription: "Standard-Bericht, teilbare Zusammenfassung, Situationspläne, Gesprächsleitfaden und 14-Tage-Beobachtungstagebuch."
  },
  it: {
    standardName: "Report NeuroMap Kids Standard",
    standardDescription: "Report PDF personalizzato e adatto all'età, con indicazioni pratiche per i genitori.",
    plusName: "Report NeuroMap Kids Plus e osservazione di 14 giorni",
    plusDescription: "Report Standard, sintesi condivisibile, piani situazionali, guida al colloquio e diario di osservazione di 14 giorni."
  },
  es: {
    standardName: "Informe NeuroMap Kids Standard",
    standardDescription: "Informe PDF personalizado y adaptado a la edad, con orientación práctica para madres y padres.",
    plusName: "Informe NeuroMap Kids Plus y observación de 14 días",
    plusDescription: "Informe Standard, resumen para compartir, planes por situación, guía de conversación y diario de observación de 14 días."
  },
  zh: {
    standardName: "NeuroMap Kids 标准报告",
    standardDescription: "个性化、符合年龄特点的 PDF 报告，并提供实用的家长建议。",
    plusName: "NeuroMap Kids Plus 报告与 14 天观察",
    plusDescription: "包含标准报告、可分享摘要、情境行动方案、沟通指南和 14 天观察日记。"
  },
  ja: {
    standardName: "NeuroMap Kids スタンダードレポート",
    standardDescription: "年齢に配慮した個別PDFレポートと、保護者向けの実践的な提案です。",
    plusName: "NeuroMap Kids Plus レポートと14日間の観察",
    plusDescription: "スタンダードレポート、共有用要約、場面別プラン、話し合いガイド、14日間の観察日記が含まれます。"
  },
  ar: {
    standardName: "تقرير NeuroMap Kids القياسي",
    standardDescription: "تقرير PDF مخصص ومراعٍ للعمر مع إرشادات عملية للوالدين.",
    plusName: "تقرير NeuroMap Kids Plus ومتابعة لمدة 14 يومًا",
    plusDescription: "يتضمن التقرير القياسي وملخصًا قابلًا للمشاركة وخططًا للمواقف ودليلًا للمحادثة وسجل متابعة لمدة 14 يومًا."
  },
  pl: {
    standardName: "Raport NeuroMap Kids Standard",
    standardDescription: "Spersonalizowany raport PDF dostosowany do wieku, z praktycznymi wskazówkami dla rodziców.",
    plusName: "Raport NeuroMap Kids Plus i 14-dniowa obserwacja",
    plusDescription: "Raport Standard, podsumowanie do udostępnienia, plany sytuacyjne, przewodnik rozmowy i 14-dniowy dziennik obserwacji."
  },
  pt: {
    standardName: "Relatório NeuroMap Kids Standard",
    standardDescription: "Relatório PDF personalizado e adequado à idade, com orientações práticas para os pais.",
    plusName: "Relatório NeuroMap Kids Plus e observação de 14 dias",
    plusDescription: "Relatório Standard, resumo partilhável, planos por situação, guia de conversa e diário de observação de 14 dias."
  },
  fr: {
    standardName: "Rapport NeuroMap Kids Standard",
    standardDescription: "Rapport PDF personnalisé et adapté à l'âge, avec des conseils pratiques pour les parents.",
    plusName: "Rapport NeuroMap Kids Plus et observation sur 14 jours",
    plusDescription: "Rapport Standard, synthèse à partager, plans par situation, guide de discussion et journal d'observation sur 14 jours."
  }
};

function getSafeLang(lang) {
  return SUPPORTED_LANGS.includes(lang) ? lang : "en";
}

function getStripeCheckoutLocale(lang) {
  const safeLang = getSafeLang(lang);
  return safeLang === "ar" ? "auto" : safeLang;
}

function getBaseAppUrl() {
  return String(env.APP_BASE_URL || "https://neuromap-kids.webflow.io").replace(/\/+$/, "");
}

function getLocalizedSuccessUrl(lang) {
  return `${getBaseAppUrl()}/${getSafeLang(lang)}-checkout-success`;
}

function getLocalizedCancelUrl(lang) {
  return `${getBaseAppUrl()}/${getSafeLang(lang)}-checkout-cancel`;
}

function getCheckoutCopy(lang, packageCode) {
  const copy = CHECKOUT_COPY[getSafeLang(lang)] || CHECKOUT_COPY.en;
  const isPlus = packageCode === "plus_v1";

  return {
    name: isPlus ? copy.plusName : copy.standardName,
    description: isPlus ? copy.plusDescription : copy.standardDescription
  };
}

function getConfiguredPriceId(productPackage) {
  if (!productPackage.stripePriceEnv) return null;
  return env[productPackage.stripePriceEnv] || null;
}

function buildLineItem({ productPackage, lang }) {
  const configuredPriceId = getConfiguredPriceId(productPackage);

  if (configuredPriceId) {
    return {
      lineItem: { price: configuredPriceId, quantity: 1 },
      stripePriceId: configuredPriceId
    };
  }

  const copy = getCheckoutCopy(lang, productPackage.code);

  return {
    lineItem: {
      price_data: {
        currency: productPackage.currency,
        unit_amount: productPackage.unitAmount,
        product_data: {
          name: copy.name,
          description: copy.description
        }
      },
      quantity: 1
    },
    stripePriceId: null
  };
}

export async function createCheckoutSession({
  internalSessionId,
  email,
  lang,
  productPackage: requestedPackage
}) {
  if (!internalSessionId) {
    throw new Error("Missing internalSessionId for Stripe checkout session.");
  }

  if (!email) {
    throw new Error("Missing email for Stripe checkout session.");
  }

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const safeLang = getSafeLang(lang);
  const productPackage = getProductPackage(requestedPackage?.code || requestedPackage);
  const { lineItem, stripePriceId } = buildLineItem({ productPackage, lang: safeLang });
  const successUrl = `${getLocalizedSuccessUrl(safeLang)}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${getLocalizedCancelUrl(safeLang)}?sid=${encodeURIComponent(internalSessionId)}`;
  const metadata = {
    internalSessionId,
    lang: safeLang,
    product: "neuromap_kids_report",
    packageCode: productPackage.code,
    offerVersion: productPackage.offerVersion,
    amountTotal: String(productPackage.unitAmount),
    currency: productPackage.currency,
    stripePriceId: stripePriceId || ""
  };

  console.log("[stripe] creating checkout", {
    internalSessionId,
    lang: safeLang,
    packageCode: productPackage.code,
    amountTotal: productPackage.unitAmount,
    currency: productPackage.currency,
    usesConfiguredPrice: Boolean(stripePriceId)
  });

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    client_reference_id: internalSessionId,
    customer_email: email,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    line_items: [lineItem],
    locale: getStripeCheckoutLocale(safeLang),
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: { metadata }
  });
}

export function constructStripeEvent(rawBody, signature) {
  if (!signature) throw new Error("Missing Stripe signature header.");
  if (!env.STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET.");

  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}
