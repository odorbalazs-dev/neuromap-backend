import {
  createSession,
  getSessionById,
  updateStripeSessionId
} from "../../services/session.service.js";

import { createCheckoutSession } from "../../services/stripe.service.js";

export async function createCheckout(req, res) {
  try {
    const { email, name, lang, payload } = req.body || {};

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Missing email"
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Missing name"
      });
    }

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({
        ok: false,
        error: "Missing payload"
      });
    }

    const session = await createSession({
      email,
      name,
      lang,
      payload
    });

    const stripeSession = await createCheckoutSession({
      internalSessionId: session.id,
      email,
      name,
      lang
    });

    await updateStripeSessionId(session.id, stripeSession.id);

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      checkoutUrl: stripeSession.url
    });
  } catch (error) {
    console.error("checkout controller error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create checkout"
    });
  }
}

export async function retryCheckout(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Missing session id"
      });
    }

    const session = await getSessionById(id);

    if (!session) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    if (session.payment_status === "paid" || session.analysis_status === "done") {
      return res.status(409).json({
        ok: false,
        error: "This session is already paid or completed."
      });
    }

    if (!session.email) {
      return res.status(400).json({
        ok: false,
        error: "Session email is missing."
      });
    }

    const stripeSession = await createCheckoutSession({
      internalSessionId: session.id,
      email: session.email,
      name: session.name,
      lang: session.lang
    });

    await updateStripeSessionId(session.id, stripeSession.id);

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      checkoutUrl: stripeSession.url
    });
  } catch (error) {
    console.error("retry checkout error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to retry checkout"
    });
  }
}