import { env } from "../config/env.js";

export class PaymentService {
  constructor(stripe) {
    this.stripe = stripe;
  }

  async createCheckoutSession({ email, sessionId, payload }) {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "NeuroMap Kids – AI kiértékelés",
            },
            unit_amount: 200,
          },
          quantity: 1,
        },
      ],
      success_url: `${env.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.cancelUrl,
      metadata: {
        sessionId,
        email,
        payload: JSON.stringify(payload || {}),
      },
    });
  }
}