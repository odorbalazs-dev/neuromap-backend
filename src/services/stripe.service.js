import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "NeuroMap Kids – AI kiértékelés"
          },
          unit_amount: 200
        },
        quantity: 1
      }
    ],

    success_url: `${env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: env.CANCEL_URL,

    metadata: {
      internalSessionId,
      email,
      name: name || "",
      lang: lang || "hu",
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