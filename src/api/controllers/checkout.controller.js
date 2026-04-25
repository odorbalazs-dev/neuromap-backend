import {
  createSession,
  updateStripeSessionId
} from "../../services/session.service.js";
import { createCheckoutSession } from "../../services/stripe.service.js";
import { validateCheckoutPayload } from "../../utils/validateCheckoutPayload.js";

export async function createCheckout(req, res) {
  try {
    const validation = validateCheckoutPayload(req.body);

    if (!validation.ok) {
      console.error("❌ Invalid checkout payload:", validation.errors);

      return res.status(400).json({
        ok: false,
        error: "Invalid checkout payload",
        details: validation.errors
      });
    }

    const { email, name, lang, payload } = req.body;

    const sessionRow = await createSession({
      email,
      name,
      lang,
      payload
    });

    const stripeSession = await createCheckoutSession({
      internalSessionId: sessionRow.id,
      email: sessionRow.email,
      name: sessionRow.name,
      lang: sessionRow.lang,
      payload: sessionRow.payload
    });

    await updateStripeSessionId(sessionRow.id, stripeSession.id);

    return res.status(201).json({
      ok: true,
      sessionId: sessionRow.id,
      stripeSessionId: stripeSession.id,
      checkoutUrl: stripeSession.url
    });
  } catch (error) {
    console.error("checkout controller error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create checkout session"
    });
  }
}