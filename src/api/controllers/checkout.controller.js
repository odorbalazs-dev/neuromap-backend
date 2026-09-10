import {
  getSessionById,
  assertSessionAccess,
  getSessionAccessTokenFromRequest,
  incrementCheckoutAttempt,
  linkStripeCheckoutSession,
  deletePendingCheckoutSession
} from "../../services/session.service.js";

import {
  createCheckoutSession,
  expireCheckoutSession
} from "../../services/stripe.service.js";
import {
  normalizeCheckoutPayload,
  stripCheckoutQuestionMetadata
} from "../../utils/normalizeCheckoutPayload.js";
import { validateCheckoutPayload } from "../../utils/validateCheckoutPayload.js";
import { getProductPackage } from "../../config/products.js";
import {
  canonicalizeQuestionnairePayload,
  QuestionnaireIntegrityError
} from "../../services/questionnaire-integrity.service.js";
import {
  assertCheckoutLaunchReady,
  assertCurrentPolicyAcceptance,
  LaunchGateError
} from "../../services/launch-gate.service.js";
import {
  ConsentError,
  releaseConsentReceipt
} from "../../services/consent.service.js";
import { createConsentedSession, withCheckoutConsent } from "../../services/checkout-consent.service.js";
import { ProcessingRestrictedError } from "../../services/data-governance.service.js";
import { safeError } from "../../utils/safeError.js";

export async function createCheckout(req, res) {
  let claimedConsent = null;
  let session = null;
  let stripeSession = null;
  let checkoutLinked = false;
  try {
    assertCheckoutLaunchReady();
    // Older cached Webflow engines may still send question display metadata.
    // Strip only that metadata before strict validation; all other raw fields
    // keep their original types and lengths. Server-side banks stay authoritative.
    const validationInput = stripCheckoutQuestionMetadata(req.body || {});
    const validation = validateCheckoutPayload(validationInput);

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: "Invalid checkout payload",
        code: "INVALID_CHECKOUT_PAYLOAD",
        details: validation.errors
      });
    }

    const normalized = normalizeCheckoutPayload(validationInput);
    const { email, name, lang, packageCode, consent, purchaseConfirmations } = normalized;
    const payload = canonicalizeQuestionnairePayload(normalized.payload, lang);
    const productPackage = getProductPackage(packageCode);
    const created = await createConsentedSession({
      email,
      name,
      lang,
      payload,
      productPackage
    }, consent, purchaseConfirmations);
    session = created.session;
    claimedConsent = created.claimed;

    const checkoutAttempt = await incrementCheckoutAttempt(session.id);
    await withCheckoutConsent(session.id, async (_lockedSession, executor) => {
      stripeSession = await createCheckoutSession({
        internalSessionId: session.id,
        email,
        name,
        lang,
        productPackage,
        sessionAccessToken: session.publicAccessToken,
        checkoutAttempt
      });

      if (!stripeSession?.id || !stripeSession?.url) {
        throw new Error("Stripe checkout session response is incomplete.");
      }

      const updatedSession = await linkStripeCheckoutSession({
        sessionId: session.id,
        stripeSessionId: stripeSession.id,
        checkoutUrl: stripeSession.url
      }, { executor });
      if (!updatedSession) {
        throw new Error("Checkout session could not be linked to the internal session.");
      }
    });
    checkoutLinked = true;

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      sessionAccessToken: session.publicAccessToken,
      checkoutUrl: stripeSession.url,
      packageCode: productPackage.code,
      amountTotal: productPackage.unitAmount,
      currency: productPackage.currency
    });
  } catch (error) {
    console.error("checkout controller error:", safeError(error));

    if (stripeSession?.id && !checkoutLinked) {
      await expireCheckoutSession(stripeSession.id).catch((expireError) => {
        console.error("failed to expire orphaned Stripe checkout session:", safeError(expireError));
      });
    }

    let deletedSession = null;
    if (session?.id) {
      deletedSession = await deletePendingCheckoutSession(session.id).catch((deleteError) => {
        console.error("failed to delete incomplete checkout session:", safeError(deleteError));
        return null;
      });
    }

    if (claimedConsent?.id && (!session || deletedSession)) {
      await releaseConsentReceipt(claimedConsent.id).catch((releaseError) => {
        console.error("failed to release consent receipt after checkout failure:", safeError(releaseError));
      });
    }

    if (error instanceof QuestionnaireIntegrityError) {
      return res.status(400).json({
        ok: false,
        error: "Invalid questionnaire payload",
        details: error.errors
      });
    }

    if (error instanceof LaunchGateError) {
      console.warn("checkout launch gate blocked:", error.missing);
      return res.status(503).json({
        ok: false,
        error: error.message,
        code: "CHECKOUT_NOT_READY"
      });
    }

    if (error instanceof ProcessingRestrictedError) {
      return res.status(409).json({ ok: false, error: "Processing is restricted. Payment cannot be started.", code: "PROCESSING_RESTRICTED" });
    }

    if (error instanceof ConsentError) {
      return res.status(error.status).json({
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    return res.status(500).json({
      ok: false,
      error: "Failed to create checkout"
    });
  }
}

export async function retryCheckout(req, res) {
  let stripeSession = null;
  let checkoutLinked = false;
  try {
    assertCheckoutLaunchReady();
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

    const sessionAccessToken = getSessionAccessTokenFromRequest(req);
    assertSessionAccess(session, sessionAccessToken);


    if (!session.consent_record) {
      return res.status(409).json({
        ok: false,
        error: "Consent must be collected again before checkout can be retried.",
        code: "CONSENT_REFRESH_REQUIRED"
      });
    }
    assertCurrentPolicyAcceptance(session.consent_record);

    const checkoutAttempt = await incrementCheckoutAttempt(session.id);
    await withCheckoutConsent(session.id, async (lockedSession, executor) => {
      stripeSession = await createCheckoutSession({
        internalSessionId: session.id,
        email: lockedSession.email,
        name: lockedSession.name,
        lang: lockedSession.lang,
        productPackage: getProductPackage(lockedSession.package_code),
        sessionAccessToken,
        checkoutAttempt
      });

      if (!stripeSession?.id || !stripeSession?.url) {
        throw new Error("Stripe checkout session response is incomplete.");
      }

      const updatedSession = await linkStripeCheckoutSession({
        sessionId: session.id,
        stripeSessionId: stripeSession.id,
        checkoutUrl: stripeSession.url
      }, { executor });
      if (!updatedSession) {
        throw new Error("Checkout session could not be linked to the internal session.");
      }
    });
    checkoutLinked = true;

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      sessionAccessToken,
      checkoutUrl: stripeSession.url
    });
  } catch (error) {
    console.error("retry checkout error:", safeError(error));

    if (stripeSession?.id && !checkoutLinked) {
      await expireCheckoutSession(stripeSession.id).catch((expireError) => {
        console.error("failed to expire orphaned retry checkout session:", safeError(expireError));
      });
    }

    if (error instanceof LaunchGateError) {
      console.warn("retry checkout launch gate blocked:", error.missing);
      return res.status(503).json({
        ok: false,
        error: error.message,
        code: "CHECKOUT_NOT_READY"
      });
    }

    if (error instanceof ConsentError) {
      return res.status(error.status).json({ ok: false, error: error.message, code: error.code });
    }

    if (error instanceof ProcessingRestrictedError) {
      return res.status(409).json({ ok: false, error: "Processing is restricted. Payment cannot be started.", code: "PROCESSING_RESTRICTED" });
    }

    if (error.status === 403) {
      return res.status(403).json({
        ok: false,
        error: "Session access denied"
      });
    }

    return res.status(500).json({
      ok: false,
      error: "Failed to retry checkout"
    });
  }
}
