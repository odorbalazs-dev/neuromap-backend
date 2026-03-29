import { handleStripeWebhook } from "../../services/webhook.service.js";

export async function stripeWebhookController(req, res) {
  try {
    const result = await handleStripeWebhook(
      req.body,
      req.headers["stripe-signature"]
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Webhook controller error:", error);

    return res.status(500).json({
      received: false,
      error: error.message || "Webhook processing failed"
    });
  }
}