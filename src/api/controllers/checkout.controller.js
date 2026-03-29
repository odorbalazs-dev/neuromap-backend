import {
  createSession,
  updateStripeSessionId
} from "../../services/sessionService.js";
import { createCheckoutSession } from "../../services/stripe.service.js";

export const createCheckout = async (req, res) => {
  try {
    const { email, name, lang, payload } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: email"
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: name"
      });
    }

    if (!lang) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: lang"
      });
    }

    if (!payload) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: payload"
      });
    }

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
};