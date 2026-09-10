import { db } from '../db/db.js';
import { retrieveStripeCharge, retrieveStripeRefund, retrieveStripeDispute, listStripeRefunds, isLiveStripeRuntime } from './stripe.service.js';

export async function synchronizePaymentAdjustment(event) {
  const object = event.data.object;
  const dispute = event.type.startsWith('charge.dispute.');
  if (event.livemode !== isLiveStripeRuntime()) throw new Error('PAYMENT_ADJUSTMENT_MODE_MISMATCH');
  let current = dispute ? await retrieveStripeDispute(object.id)
    : event.type.startsWith('refund.') ? await retrieveStripeRefund(object.id) : await retrieveStripeCharge(object.id);
  const chargeId = current.object === 'charge' ? current.id : typeof current.charge === 'string' ? current.charge : current.charge?.id;
  const charge = await retrieveStripeCharge(chargeId);
  if (charge.livemode !== isLiveStripeRuntime()) throw new Error('PAYMENT_ADJUSTMENT_MODE_MISMATCH');
  const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) throw new Error('PAYMENT_ADJUSTMENT_REFERENCE_MISSING');
  const orders = await db.query(`SELECT DISTINCT s.* FROM sessions s LEFT JOIN payment_attempts p ON p.session_id=s.id
    WHERE s.stripe_payment_intent_id=$1 OR p.payment_intent_id=$1`, [pi]);
  if (orders.rows.length !== 1) throw new Error('PAYMENT_ADJUSTMENT_ORDER_NOT_FOUND_OR_AMBIGUOUS');
  const session = orders.rows[0];
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT financial_status FROM sessions WHERE id=$1 FOR UPDATE', [session.id]);
    // Serialize provider refreshes so out-of-order callbacks cannot regress local state.
    current = dispute ? await retrieveStripeDispute(object.id) : current;
    const refunds = dispute ? null : await listStripeRefunds(pi);
    if (refunds?.has_more) throw new Error('PAYMENT_ADJUSTMENT_REVIEW_REQUIRED');
    const changes = dispute ? [current] : refunds.data;
    for (const item of changes) {
      await client.query(`INSERT INTO payment_adjustments(provider_id,session_id,kind,status,amount,currency)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(provider_id) DO UPDATE SET status=EXCLUDED.status,
        amount=EXCLUDED.amount,updated_at=NOW()`, [item.id,session.id,dispute?'dispute':'refund',item.status,item.amount,item.currency]);
    }
    const totals = await client.query(`SELECT COALESCE(SUM(amount) FILTER(WHERE kind='refund' AND status='succeeded'),0)::int AS refunded,
      COUNT(*) FILTER(WHERE kind='dispute' AND status NOT IN ('won','warning_closed','prevented'))::int AS disputed,
      COUNT(*) FILTER(WHERE kind='refund' AND status IN ('pending','requires_action'))::int AS pending
      FROM payment_adjustments WHERE session_id=$1`, [session.id]);
    const row = totals.rows[0];
    const status = row.disputed ? 'disputed' : row.refunded >= session.amount_total ? 'refunded'
      : row.refunded > 0 ? 'partially_refunded' : row.pending ? 'refund_pending'
      : locked.rows[0]?.financial_status === 'review' ? 'review' : 'clear';
    await client.query('UPDATE sessions SET financial_status=$2 WHERE id=$1', [session.id,status]);
    // Financial correction is an explicit, durable work item, never an unapproved automatic refund.
    await client.query(`INSERT INTO payment_reviews(session_id,provider_event_id,reason,amount,currency)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, [session.id,event.id,
      dispute?'dispute_review':'refund_invoice_correction',current.amount || row.refunded,current.currency]);
    if (status !== 'clear') {
      await client.query(`UPDATE analysis_jobs SET status='cancelled',lease_token=NULL,locked_at=NULL
        WHERE session_id=$1 AND status IN ('queued','processing')`, [session.id]);
      await client.query(`UPDATE observation_programs SET status='cancelled' WHERE session_id=$1 AND status='active'`, [session.id]);
    }
    await client.query('COMMIT');
    return { processed: true, reviewRequired: true };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
