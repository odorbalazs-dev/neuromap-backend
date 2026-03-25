import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: "2024-06-20"
});

export async function createCheckoutSession(payload) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "NeuroMap Kids – AI kiértékelés"
          },
          unit_amount: 200 // 2 USD
        },
        quantity: 1
      }
    ],

    success_url: env.successUrl + "?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: env.cancelUrl,

    metadata: {
      payload: JSON.stringify(payload)
    }
  });

  return session;
}