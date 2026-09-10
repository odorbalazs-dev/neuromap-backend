import { db } from '../db/db.js';
import { listCheckoutSessions, isLiveStripeRuntime } from './stripe.service.js';
import { recordPaymentAttempt } from './payment-attempt.service.js';
import { fulfillVerifiedCheckout } from './payment-fulfillment.service.js';
import { getProductPackage, assertCheckoutMatchesPackage } from '../config/products.js';

// Read-only Stripe discovery also recovers provider creations whose response/DB commit was lost.
export async function discoverStripePayments({ pages = 5 } = {}) {
  const live = isLiveStripeRuntime();
  let checked = 0, recovered = 0;
  await db.query('INSERT INTO payment_reconciliation_cursors(livemode) VALUES ($1) ON CONFLICT DO NOTHING', [live]);
  const claimed = await db.query(`UPDATE payment_reconciliation_cursors SET lease_token=gen_random_uuid(),
    locked_until=NOW()+INTERVAL '4 minutes' WHERE livemode=$1 AND (locked_until IS NULL OR locked_until<NOW()) RETURNING *`, [live]);
  const cursor = claimed.rows[0];
  if (!cursor) return { checked, recovered, busy: true };
  try {
    for (let page = 0; page < Math.min(10, Math.max(1, pages)); page++) {
      const batch = await listCheckoutSessions({ created: { gte: Math.floor(new Date(cursor.window_start)/1000),
        lte: Math.floor(new Date(cursor.window_end)/1000) }, ...(cursor.starting_after ? { starting_after: cursor.starting_after } : {}) });
      for (const checkout of batch.data) {
        checked++;
        const id = checkout.metadata?.internalSessionId;
        if (checkout.livemode !== live || checkout.client_reference_id !== id
            || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id || '')) continue;
        const result = await db.query('SELECT * FROM sessions WHERE id=$1', [id]);
        const session = result.rows[0];
        if (!session || (!session.checkout_request_hash && session.stripe_session_id !== checkout.id)) continue;
        const product = getProductPackage(session.package_code);
        if (checkout.metadata.packageCode !== product.code) continue;
        try { assertCheckoutMatchesPackage(checkout, product); } catch { continue; }
        await recordPaymentAttempt(checkout, id, Number(checkout.metadata.checkoutAttempt || 1));
        if (checkout.payment_status === 'paid') { await fulfillVerifiedCheckout(checkout); recovered++; }
        else await db.query(`UPDATE sessions SET stripe_session_id=$2,checkout_url=$3
          WHERE id=$1 AND stripe_session_id IS NULL AND payment_status='pending'`, [id,checkout.id,checkout.url || null]);
      }
      cursor.starting_after = batch.data.at(-1)?.id || null;
      if (!batch.has_more) {
        await db.query(`UPDATE payment_reconciliation_cursors SET window_start=window_end-INTERVAL '1 hour',
          window_end=NOW(),starting_after=NULL,updated_at=NOW() WHERE livemode=$1 AND lease_token=$2`, [live,cursor.lease_token]);
        break;
      }
      const checkpoint = await db.query(`UPDATE payment_reconciliation_cursors SET starting_after=$2,updated_at=NOW(),
        locked_until=NOW()+INTERVAL '4 minutes' WHERE livemode=$1 AND lease_token=$3`, [live,cursor.starting_after,cursor.lease_token]);
      if (!checkpoint.rowCount) break;
    }
    return { checked, recovered };
  } finally {
    await db.query('UPDATE payment_reconciliation_cursors SET lease_token=NULL,locked_until=NULL WHERE livemode=$1 AND lease_token=$2', [live,cursor.lease_token]);
  }
}
