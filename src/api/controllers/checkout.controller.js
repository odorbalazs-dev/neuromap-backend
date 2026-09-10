import { getSessionById, assertSessionAccess, getSessionAccessTokenFromRequest } from '../../services/session.service.js';
import { normalizeCheckoutPayload, stripCheckoutQuestionMetadata } from '../../utils/normalizeCheckoutPayload.js';
import { validateCheckoutPayload } from '../../utils/validateCheckoutPayload.js';
import { getProductPackage } from '../../config/products.js';
import { canonicalizeQuestionnairePayload, QuestionnaireIntegrityError } from '../../services/questionnaire-integrity.service.js';
import { assertCheckoutLaunchReady, assertCurrentPolicyAcceptance, getLaunchGateStatus, LaunchGateError } from '../../services/launch-gate.service.js';
import { ConsentError } from '../../services/consent.service.js';
import { createConsentedSession, withCheckoutConsent } from '../../services/checkout-consent.service.js';
import { ProcessingRestrictedError } from '../../services/data-governance.service.js';
import { startOrResumePayment } from '../../services/payment-attempt.service.js';
import { safeError } from '../../utils/safeError.js';
import { createHash } from 'crypto';

function privateResponse(res) {
  res.setHeader('Cache-Control', 'no-store, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
}

function checkoutError(error, res) {
  console.error('[checkout] request failed', safeError(error));
  if (error instanceof LaunchGateError) {
    return res.status(503).json({ ok: false, code: 'CHECKOUT_NOT_READY', error: 'Checkout is unavailable.' });
  }
  if (error instanceof ConsentError) {
    return res.status(error.status).json({ ok: false, code: error.code, error: 'Checkout requires attention.' });
  }
  if (error instanceof ProcessingRestrictedError) {
    return res.status(409).json({ ok: false, code: 'PROCESSING_RESTRICTED', error: 'Processing is restricted.' });
  }
  if (error instanceof QuestionnaireIntegrityError) {
    return res.status(400).json({ ok: false, code: 'INVALID_CHECKOUT_PAYLOAD', error: 'Invalid questionnaire payload.' });
  }
  if (error.status === 403) return res.status(403).json({ ok: false, code: 'SESSION_ACCESS_DENIED', error: 'Session access denied.' });
  return res.status(503).json({ ok: false, code: 'CHECKOUT_RETRY_SAFE', error: 'Payment could not be verified. Retry the same request.' });
}

export function checkoutAvailability(_req, res) {
  privateResponse(res);
  return res.json({ ok: true, available: !getLaunchGateStatus().blocking });
}

export async function createCheckout(req, res) {
  privateResponse(res);
  try {
    assertCheckoutLaunchReady();
    const validationInput = stripCheckoutQuestionMetadata(req.body || {});
    const validation = validateCheckoutPayload(validationInput);
    if (!validation.ok) return res.status(400).json({ ok: false, code: 'INVALID_CHECKOUT_PAYLOAD', error: 'Invalid checkout payload', details: validation.errors });
    const resumeToken = String(req.headers['x-checkout-key'] || '');
    if (resumeToken && !/^[A-Za-z0-9_-]{43}$/.test(resumeToken)) {
      return res.status(400).json({ ok: false, code: 'INVALID_CHECKOUT_KEY', error: 'Invalid checkout key.' });
    }
    const normalized = normalizeCheckoutPayload(validationInput);
    const { email, name, lang, packageCode, consent, purchaseConfirmations } = normalized;
    const payload = canonicalizeQuestionnairePayload(normalized.payload, lang);
    const productPackage = getProductPackage(packageCode);
    const stableToken = resumeToken || createHash('sha256').update('checkout-resume:' + consent.token).digest('base64url');
    const { session } = await createConsentedSession({ email, name, lang, payload, productPackage, resumeToken: stableToken }, consent, purchaseConfirmations);
    const checkout = await withCheckoutConsent(session.id, (locked, executor) => startOrResumePayment(locked, session.publicAccessToken, executor));
    return res.json({ ok: true, sessionId: session.id, sessionAccessToken: session.publicAccessToken,
      checkoutUrl: checkout.url, packageCode: productPackage.code, amountTotal: productPackage.unitAmount, currency: productPackage.currency });
  } catch (error) {
    // Retain the consent-bound order and stable Stripe key after an uncertain provider outcome.
    return checkoutError(error, res);
  }
}

export async function retryCheckout(req, res) {
  privateResponse(res);
  try {
    assertCheckoutLaunchReady();
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(req.params.id || '')) {
      return res.status(400).json({ ok: false, code: 'INVALID_SESSION', error: 'Invalid session.' });
    }
    const session = await getSessionById(req.params.id);
    if (!session) return res.status(404).json({ ok: false, code: 'SESSION_NOT_FOUND', error: 'Session not found.' });
    const token = getSessionAccessTokenFromRequest(req);
    assertSessionAccess(session, token);
    if (session.payment_status === 'paid' || session.analysis_status === 'done') {
      return res.status(409).json({ ok: false, code: 'PAYMENT_ALREADY_COMPLETED', error: 'Payment is already complete.' });
    }
    assertCurrentPolicyAcceptance(session.consent_record || {});
    const checkout = await withCheckoutConsent(session.id, (locked, executor) => startOrResumePayment(locked, token, executor));
    return res.json({ ok: true, sessionId: session.id, sessionAccessToken: token, checkoutUrl: checkout.url });
  } catch (error) {
    return checkoutError(error, res);
  }
}
