import { db } from '../db/db.js';
import { getProductPackage, assertCheckoutMatchesPackage } from '../config/products.js';
import { isLiveStripeRuntime } from './stripe.service.js';
import { enqueueAnalysisJob } from './analysis-queue.service.js';
import { enqueuePostPaymentTasks } from './post-payment-outbox.service.js';
import { recordPaymentAttempt } from './payment-attempt.service.js';

export async function fulfillVerifiedCheckout(checkout) {
  if (checkout?.object !== 'checkout.session' || checkout.livemode !== isLiveStripeRuntime()) {
    throw new Error('PAYMENT_MODE_MISMATCH');
  }
  const id = checkout.metadata?.internalSessionId;
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id || '') || checkout.client_reference_id !== id) {
    throw new Error('PAYMENT_REFERENCE_INVALID');
  }
  if (checkout.payment_status !== 'paid') return { skipped: true, reason: 'checkout_not_paid' };
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const ref = await client.query('SELECT consent_event_id FROM sessions WHERE id=$1', [id]);
    const consent = await client.query('SELECT * FROM consent_events WHERE id=$1 FOR UPDATE', [ref.rows[0]?.consent_event_id]);
    const result = await client.query('SELECT * FROM sessions WHERE id=$1 FOR UPDATE', [id]);
    const session = result.rows[0];
    if (!session) throw new Error('PAYMENT_ORDER_NOT_FOUND');
    const known = await client.query('SELECT * FROM payment_attempts WHERE stripe_session_id=$1 AND session_id=$2', [checkout.id, id]);
    const recoveredCreation = !session.stripe_session_id && session.checkout_request_hash
      && Number(checkout.metadata.checkoutAttempt) === Math.max(1, Number(session.checkout_attempt || 1));
    if (!known.rows[0] && session.stripe_session_id !== checkout.id && !recoveredCreation) throw new Error('PAYMENT_CHECKOUT_MISMATCH');
    if (known.rows[0] && known.rows[0].livemode !== checkout.livemode) throw new Error('PAYMENT_MODE_MISMATCH');
    const product = getProductPackage(session.package_code);
    if (checkout.metadata.packageCode !== product.code) throw new Error('PAYMENT_PACKAGE_MISMATCH');
    assertCheckoutMatchesPackage(checkout, product);
    if (!known.rows[0]) await recordPaymentAttempt(checkout, id, Number(checkout.metadata.checkoutAttempt || 1), client);
    const pi = typeof checkout.payment_intent === 'string' ? checkout.payment_intent : checkout.payment_intent?.id || null;
    await client.query(`UPDATE payment_attempts SET status='complete',payment_intent_id=$2,checked_at=NOW() WHERE stripe_session_id=$1`, [checkout.id, pi]);
    const duplicate = session.payment_status === 'paid' && session.stripe_session_id !== checkout.id;
    const restricted = session.processing_restricted_at || session.sensitive_data_erased_at || session.data_redacted_at || consent.rows[0]?.withdrawn_at || !consent.rows[0];
    if (duplicate || restricted || session.financial_status !== 'clear') {
      const reason = duplicate ? 'duplicate_payment' : restricted ? 'payment_after_consent_restriction' : 'financial_review';
      await client.query(`INSERT INTO payment_reviews(session_id,provider_event_id,reason,amount,currency)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, [id, reason + ':' + checkout.id, reason, checkout.amount_total, checkout.currency]);
      if (!duplicate) await client.query(`UPDATE sessions SET payment_status='paid',paid_at=COALESCE(paid_at,NOW()),
        financial_status=CASE WHEN financial_status='clear' THEN 'review' ELSE financial_status END,
        stripe_payment_intent_id=COALESCE(stripe_payment_intent_id,$2) WHERE id=$1`, [id, pi]);
      await client.query('COMMIT');
      return { processed: true, reviewRequired: true };
    }
    await client.query(`UPDATE sessions SET payment_status='paid', paid_at=COALESCE(paid_at,NOW()),
      stripe_session_id=$2,stripe_payment_intent_id=$3,checkout_cancelled_at=NULL,
      amount_total=$4,currency=$5 WHERE id=$1`, [id,checkout.id,pi,checkout.amount_total,checkout.currency]);
    let job = null;
    if (session.analysis_status !== 'done') {
      job = await enqueueAnalysisJob(id, { executor: client });
      if (job) await client.query(`UPDATE sessions SET analysis_status=CASE WHEN analysis_status='processing' THEN analysis_status ELSE 'queued' END
        WHERE id=$1 AND analysis_status <> 'done'`, [id]);
    }
    await enqueuePostPaymentTasks(client, id, checkout);
    await client.query('COMMIT');
    return { processed: true, queued: Boolean(job), sessionId: id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
