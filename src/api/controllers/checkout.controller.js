import {
  createSession,
  getSessionById,
  updateStripeSessionId
} from "../../services/session.service.js";

import { createCheckoutSession } from "../../services/stripe.service.js";
import { normalizeCheckoutPayload } from "../../utils/normalizeCheckoutPayload.js";
import { validateCheckoutPayload } from "../../utils/validateCheckoutPayload.js";
import { getProductPackage } from "../../config/products.js";

export async function createCheckout(req, res) {
  try {
    const validation = validateCheckoutPayload(req.body || {});

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: "Invalid checkout payload",
        details: validation.errors
      });
    }

    const { email, name, lang, payload, packageCode } =
      normalizeCheckoutPayload(req.body || {});
    const productPackage = getProductPackage(packageCode);

    const session = await createSession({
      email,
      name,
      lang,
      payload,
      productPackage
    });

    const stripeSession = await createCheckoutSession({
      internalSessionId: session.id,
      email,
      name,
      lang,
      productPackage
    });

    await updateStripeSessionId(session.id, stripeSession.id);

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      checkoutUrl: stripeSession.url,
      packageCode: productPackage.code,
      amountTotal: productPackage.unitAmount,
      currency: productPackage.currency
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
      lang: session.lang,
      productPackage: getProductPackage(session.package_code)
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
