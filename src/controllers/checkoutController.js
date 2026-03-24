import { createPendingSession, attachStripeSessionId } from "../services/sessionService.js";
import { createCheckoutSession } from "../services/stripeService.js";

function validatePayload(body) {
  if (!body?.name || !body?.email) {
    throw new Error("Missing required fields: name or email.");
  }

  if (!Array.isArray(body?.triageAnswers) || !Array.isArray(body?.answers)) {
    throw new Error("Invalid questionnaire payload.");
  }
}

export async function createCheckoutSessionController(req, res) {
  try {
    validatePayload(req.body);

    const sessionRow = await createPendingSession(req.body);

    const stripeSession = await createCheckoutSession({
      internalSessionId: sessionRow.id,
      customerEmail: req.body.email
    });

    await attachStripeSessionId(sessionRow.id, stripeSession.id);

    return res.status(200).json({
      ok: true,
      url: stripeSession.url,
      sessionId: sessionRow.id
    });
  } catch (error) {
    console.error("checkout error:", error);
    return res.status(400).json({
      ok: false,
      error: error.message || "Failed to create checkout session."
    });
  }
}