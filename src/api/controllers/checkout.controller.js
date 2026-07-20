import {
  createSession,
  getSessionById,
  assertSessionAccess,
  getSessionAccessTokenFromRequest,
  incrementCheckoutAttempt,
  updateStripeSessionId
} from "../../services/session.service.js";

import { createCheckoutSession } from "../../services/stripe.service.js";
import { normalizeCheckoutPayload } from "../../utils/normalizeCheckoutPayload.js";
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
  claimConsentReceipt,
  ConsentError,
  releaseConsentReceipt
} from "../../services/consent.service.js";

export async function createCheckout(req, res) {
  try {
    assertCheckoutLaunchReady();
    const validation = validateCheckoutPayload(req.body || {});

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: "Invalid checkout payload",
        details: validation.errors
      });
    }

    const normalized = normalizeCheckoutPayload(req.body || {});
    const { email, name, lang, packageCode, consent } = normalized;
    const payload = canonicalizeQuestionnairePayload(normalized.payload, lang);
    const productPackage = getProductPackage(packageCode);
    const claimedConsent = await claimConsentReceipt(consent);

    let session;
    try {
      session = await createSession({
        email,
        name,
        lang,
        payload,
        productPackage,
        consent: claimedConsent.snapshot,
        consentEventId: claimedConsent.id
      });
    } catch (sessionError) {
      await releaseConsentReceipt(claimedConsent.id).catch((releaseError) => {
        console.error("failed to release consent receipt:", releaseError);
      });
      throw sessionError;
    }

    const stripeSession = await createCheckoutSession({
      internalSessionId: session.id,
      email,
      name,
      lang,
      productPackage,
      sessionAccessToken: session.publicAccessToken,
      checkoutAttempt: await incrementCheckoutAttempt(session.id)
    });

    await updateStripeSessionId(session.id, stripeSession.id);

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
    console.error("checkout controller error:", error);

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

    const stripeSession = await createCheckoutSession({
      internalSessionId: session.id,
      email: session.email,
      name: session.name,
      lang: session.lang,
      productPackage: getProductPackage(session.package_code),
      sessionAccessToken,
      checkoutAttempt: await incrementCheckoutAttempt(session.id)
    });

    await updateStripeSessionId(session.id, stripeSession.id);

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      sessionAccessToken,
      checkoutUrl: stripeSession.url
    });
  } catch (error) {
    console.error("retry checkout error:", error);

    if (error instanceof LaunchGateError) {
      return res.status(503).json({
        ok: false,
        error: error.message,
        code: "CHECKOUT_NOT_READY"
      });
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
