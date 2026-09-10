import { db } from '../db/db.js';
import { createCheckoutSession, retrieveCheckoutSession, expireCheckoutSession, isLiveStripeRuntime } from './stripe.service.js';
import { linkStripeCheckoutSession } from './session.service.js';
import { getProductPackage } from '../config/products.js';
import { ConsentError } from './consent.service.js';

export async function recordPaymentAttempt(checkout, sessionId, attempt, executor = db) {
  if (checkout.livemode !== isLiveStripeRuntime() || checkout.metadata?.internalSessionId !== sessionId) {
    throw new Error('CHECKOUT_BINDING_INVALID');
  }
  await executor.query(`INSERT INTO payment_attempts
    (stripe_session_id, session_id, attempt, livemode, status, payment_intent_id, expires_at, checked_at)
    VALUES ($1,$2,$3,$4,$5,$6,to_timestamp($7),NOW())
    ON CONFLICT (stripe_session_id) DO UPDATE SET status=EXCLUDED.status,
      payment_intent_id=EXCLUDED.payment_intent_id, expires_at=EXCLUDED.expires_at, checked_at=NOW()
    WHERE payment_attempts.session_id=EXCLUDED.session_id`,
  [checkout.id, sessionId, attempt, checkout.livemode, checkout.status,
    typeof checkout.payment_intent === 'string' ? checkout.payment_intent : checkout.payment_intent?.id || null,
    checkout.expires_at || null]);
}

// Called under the consent -> session lock, shared by create and retry.
export async function startOrResumePayment(session, token, executor) {
  let attempt = Math.max(1, Number(session.checkout_attempt || 1));
  if (session.stripe_session_id) {
    const previous = await retrieveCheckoutSession(session.stripe_session_id);
    if (previous.payment_status === 'paid' || previous.status === 'complete') {
      throw new ConsentError('Payment is being verified.', { status: 409, code: 'PAYMENT_ALREADY_COMPLETED' });
    }
    await recordPaymentAttempt(previous, session.id, attempt, executor);
    if (previous.status === 'open' && previous.url) return previous;
    if (previous.status !== 'expired') throw new Error('CHECKOUT_STATE_UNKNOWN');
    attempt += 1;
  } else if (Date.now() - new Date(session.created_at).getTime() > 23 * 3600000) {
    // Stripe's idempotency retention is finite. Do not guess after an uncertain old request.
    throw new ConsentError('Payment needs support review.', { status: 409, code: 'PAYMENT_REVIEW_REQUIRED' });
  }
  const checkout = await createCheckoutSession({
    internalSessionId: session.id, email: session.email, lang: session.lang,
    productPackage: getProductPackage(session.package_code), sessionAccessToken: token, checkoutAttempt: attempt
  });
  if (!checkout?.id || !checkout?.url || checkout.status !== 'open') throw new Error('CHECKOUT_RESPONSE_INVALID');
  await recordPaymentAttempt(checkout, session.id, attempt, executor);
  await linkStripeCheckoutSession({ sessionId: session.id, stripeSessionId: checkout.id, checkoutUrl: checkout.url }, { executor });
  await executor.query('UPDATE sessions SET checkout_attempt = $2 WHERE id = $1', [session.id, attempt]);
  return checkout;
}

export async function expireRestrictedPayments({ limit = 50, consentId = null } = {}) {
  const candidates = await db.query(`SELECT p.* FROM payment_attempts p JOIN sessions s ON s.id=p.session_id
    JOIN consent_events c ON c.id=s.consent_event_id
    WHERE p.status='open' AND (s.processing_restricted_at IS NOT NULL OR c.withdrawn_at IS NOT NULL
      OR c.expires_at <= NOW()) AND ($2::uuid IS NULL OR c.id=$2::uuid)
    ORDER BY p.checked_at ASC NULLS FIRST LIMIT $1`, [limit, consentId]);
  let expired = 0, failed = 0;
  for (const attempt of candidates.rows) {
    if (attempt.livemode !== isLiveStripeRuntime()) continue;
    try {
      let checkout = await retrieveCheckoutSession(attempt.stripe_session_id);
      if (checkout.status === 'open') checkout = await expireCheckoutSession(checkout.id);
      await recordPaymentAttempt(checkout, attempt.session_id, attempt.attempt);
      if (checkout.status === 'expired') expired += 1;
      if (checkout.payment_status === 'paid') {
        await db.query(`INSERT INTO payment_reviews(session_id,provider_event_id,reason,amount,currency)
          VALUES ($1,$2,'payment_after_consent_restriction',$3,$4) ON CONFLICT DO NOTHING`,
        [attempt.session_id, 'restricted:' + checkout.id, checkout.amount_total, checkout.currency]);
      }
    } catch (error) {
      failed++;
      await db.query('UPDATE payment_attempts SET checked_at=NOW() WHERE stripe_session_id=$1', [attempt.stripe_session_id]);
      console.error('[payment-expiry] retry required', { type: error?.type || error?.name || 'Error' });
    }
  }
  return { checked: candidates.rowCount, expired, failed };
}
