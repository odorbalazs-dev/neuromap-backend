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

    const isSignatureError =
      error?.type === "StripeSignatureVerificationError" ||
      error?.message?.toLowerCase().includes("signature");

    return res.status(isSignatureError ? 400 : 500).json({
      received: false,
      error: error.message || "Webhook processing failed"
    });
  }
}