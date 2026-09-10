import { safeError } from "../utils/safeError.js";
import { db } from "../db/db.js";
import { constructStripeEvent, isLiveStripeRuntime, retrieveStripeEvent } from "./stripe.service.js";
import { enqueuePostPaymentTasks } from "./post-payment-outbox.service.js";
import { fulfillVerifiedCheckout } from "./payment-fulfillment.service.js";
import { synchronizePaymentAdjustment } from "./payment-adjustment.service.js";

function sanitizeWebhookPayload(event) {
  const object = event?.data?.object || {};
  const metadata = object.metadata || {};

  return {
    id: event?.id || null,
    type: event?.type || null,
    created: event?.created || null,
    livemode: Boolean(event?.livemode),
    data: {
      object: {
        id: object.id || null,
        object: object.object || null,
        status: object.status || null,
        payment_status: object.payment_status || null,
        amount_total: object.amount_total ?? null,
        currency: object.currency || null,
        client_reference_id: object.client_reference_id || null,
        metadata: {
          internalSessionId: metadata.internalSessionId || null,
          lang: metadata.lang || null,
          product: metadata.product || null,
          packageCode: metadata.packageCode || null,
          offerVersion: metadata.offerVersion || null,
          amountTotal: metadata.amountTotal || null,
          currency: metadata.currency || null,
          stripePriceId: metadata.stripePriceId || null,
          checkoutAttempt: metadata.checkoutAttempt || null
        }
      }
    }
  };
}

async function claimWebhookEvent(event) {
  const safePayload = sanitizeWebhookPayload(event);

  const result = await db.query(
    `
    INSERT INTO webhook_events (
      provider,
      event_id,
      event_type,
      payload,
      status,
      processing_token,
      processing_started_at
    )
    VALUES ($1, $2, $3, $4, 'processing', gen_random_uuid(), NOW())
    ON CONFLICT (event_id)
    DO UPDATE SET
      event_type = EXCLUDED.event_type,
      payload = EXCLUDED.payload,
      status = 'processing',
      processing_token = gen_random_uuid(),
      processing_started_at = NOW(),
      error_message = NULL
    WHERE webhook_events.status IN ('received', 'failed')
       OR (
        webhook_events.status = 'processing'
        AND COALESCE(webhook_events.processing_started_at, webhook_events.created_at)
          < NOW() - INTERVAL '15 minutes'
       )
    RETURNING *
    `,
    ["stripe", event.id, event.type, safePayload]
  );

  if (result.rows[0]) {
    return {
      row: result.rows[0],
      processingToken: result.rows[0].processing_token
    };
  }

  const existing = await db.query(
    `
    SELECT *
    FROM webhook_events
    WHERE event_id = $1
    LIMIT 1
    `,
    [event.id]
  );

  return {
    row: existing.rows[0] || null,
    processingToken: null
  };
}

async function markWebhookProcessed(eventId, processingToken, postPayment = null) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (postPayment) await enqueuePostPaymentTasks(client, postPayment.sessionId, postPayment.checkoutSession);
    const updated = await client.query(
    `
    UPDATE webhook_events
    SET status = 'processed',
        processed_at = NOW(),
        error_message = NULL,
        processing_token = NULL
    WHERE event_id = $1
      AND processing_token = $2
    RETURNING event_id
    `,
    [eventId, processingToken]
  );
    if (!updated.rowCount) throw new Error("Webhook processing claim was lost");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function markWebhookFailed(eventId, processingToken, errorMessage) {
  await db.query(
    `
    UPDATE webhook_events
    SET status = 'failed',
        error_message = $3,
        processing_token = NULL
    WHERE event_id = $1
      AND processing_token = $2
    `,
    [eventId, processingToken, errorMessage]
  );
}


export async function processVerifiedStripeEvent(event) {
  if (event.livemode !== isLiveStripeRuntime()) throw new Error('PAYMENT_EVENT_MODE_MISMATCH');
  const claim = await claimWebhookEvent(event);
  if (!claim.processingToken) {
    return { received: true, duplicate: true, alreadyProcessed: claim.row?.status === 'processed' };
  }
  try {
    let outcome = { ignored: true };
    if (event.type === 'checkout.session.completed') {
      outcome = await fulfillVerifiedCheckout(event.data.object);
    } else if (/^(refund\.|charge\.refunded$|charge\.dispute\.)/.test(event.type)) {
      outcome = await synchronizePaymentAdjustment(event);
    }
    await markWebhookProcessed(event.id, claim.processingToken);
    return { received: true, ...outcome };
  } catch (error) {
    await markWebhookFailed(event.id, claim.processingToken, safeError(error).type);
    console.error('[webhook] processing failed', { eventId: event.id, error: safeError(error) });
    throw error;
  }
}

export async function handleStripeWebhook(rawBody, signature) {
  return processVerifiedStripeEvent(constructStripeEvent(rawBody, signature));
}

export async function recoverStripeEvents({ limit = 20 } = {}) {
  const pending = await db.query(`SELECT event_id FROM webhook_events WHERE provider='stripe'
    AND (status IN ('received','failed') OR (status='processing' AND processing_started_at < NOW()-INTERVAL '15 minutes'))
    AND created_at > NOW()-INTERVAL '28 days'
    ORDER BY last_recovery_at ASC NULLS FIRST,created_at ASC LIMIT $1`, [limit]);
  let recovered = 0, failed = 0;
  for (const row of pending.rows) {
    try {
      // Re-fetch the authenticated provider object rather than trusting a reduced stored snapshot.
      await processVerifiedStripeEvent(await retrieveStripeEvent(row.event_id));
      recovered += 1;
    } catch (error) {
      failed++;
      console.error('[webhook-recovery] deferred', safeError(error));
    } finally {
      await db.query('UPDATE webhook_events SET last_recovery_at=NOW() WHERE event_id=$1', [row.event_id]);
    }
  }
  return { checked: pending.rowCount, recovered, failed };
}
