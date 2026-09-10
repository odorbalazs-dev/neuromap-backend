import { enqueueAnalysisJob } from "./analysis-queue.service.js";
import { safeError } from "../utils/safeError.js";
import { db } from "../db/db.js";
import { constructStripeEvent } from "./stripe.service.js";
import {
  getSessionById,
  markSessionPaid,
  markAnalysisQueued,
  markAnalysisFailed,
  markCheckoutRecoveredOrPaid
} from "./session.service.js";
import { enqueuePostPaymentTasks } from "./post-payment-outbox.service.js";
import {
  assertCheckoutMatchesPackage,
  getProductPackage
} from "../config/products.js";

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

function isCheckoutPaid(checkoutSession) {
  return (
    checkoutSession &&
    checkoutSession.object === "checkout.session" &&
    checkoutSession.payment_status === "paid"
  );
}

export async function handleStripeWebhook(rawBody, signature) {
  const event = constructStripeEvent(rawBody, signature);
  const webhookClaim = await claimWebhookEvent(event);
  const webhookRow = webhookClaim.row;
  const processingToken = webhookClaim.processingToken;

  if (!processingToken) {
    return {
      received: true,
      duplicate: true,
      alreadyProcessed: webhookRow?.status === "processed",
      inProgress: webhookRow?.status === "processing",
      eventType: event.type
    };
  }

  let internalSessionId = null;
  let phase = "received";

  try {
    if (event.type !== "checkout.session.completed") {
      await markWebhookProcessed(event.id, processingToken);

      return {
        received: true,
        ignored: true,
        eventType: event.type
      };
    }

    const checkoutSession = event.data.object;
    internalSessionId = checkoutSession.metadata?.internalSessionId || null;

    if (!internalSessionId) {
      throw new Error("Missing internalSessionId in Stripe metadata.");
    }

    if (!isCheckoutPaid(checkoutSession)) {
      await markWebhookProcessed(event.id, processingToken);

      return {
        received: true,
        skipped: true,
        reason: "checkout_not_paid",
        paymentStatus: checkoutSession.payment_status || null
      };
    }

    phase = "load_session";
    const sessionRow = await getSessionById(internalSessionId);

    if (!sessionRow) {
      throw new Error("Session not found.");
    }

    phase = "verify_product";
    const productPackage = getProductPackage(sessionRow.package_code);
    const metadataPackageCode = checkoutSession.metadata?.packageCode || "legacy_500_v1";

    if (metadataPackageCode !== productPackage.code) {
      throw new Error(
        `Stripe package mismatch: expected ${productPackage.code}, received ${metadataPackageCode}.`
      );
    }

    assertCheckoutMatchesPackage(checkoutSession, productPackage);

    if (sessionRow.analysis_status === "done") {
      await markWebhookProcessed(event.id, processingToken, { sessionId: internalSessionId, checkoutSession });

      return {
        received: true,
        skipped: true,
        reason: "analysis_already_done"
      };
    }

    phase = "mark_paid";
    await markSessionPaid(internalSessionId, {
      amountTotal: checkoutSession.amount_total,
      currency: String(checkoutSession.currency || productPackage.currency).toLowerCase(),
      stripePriceId: checkoutSession.metadata?.stripePriceId || null
    });

    phase = "clear_recovery_state";
    await markCheckoutRecoveredOrPaid(internalSessionId);

    phase = "queue_analysis";

    const queuedRow = await markAnalysisQueued(internalSessionId);

    if (!queuedRow) {
      throw new Error("Could not queue analysis job.");
    }

    await enqueueAnalysisJob(internalSessionId);

    await markWebhookProcessed(event.id, processingToken, { sessionId: internalSessionId, checkoutSession });

    return {
      received: true,
      processed: true,
      queued: true,
      sessionId: internalSessionId
    };
  } catch (error) {
    const message = `[${phase}] ${safeError(error).type}`;

    console.error("Webhook processing failed:", {
      eventId: event?.id,
      eventType: event?.type,
      internalSessionId,
      phase,
      error: safeError(error)
    });

    if (internalSessionId) {
      try {
        const latestSession = await getSessionById(internalSessionId);

        if (latestSession?.analysis_status !== "done") {
          await markAnalysisFailed(internalSessionId, message);
        }
      } catch (nestedError) {
        console.error("Failed to persist analysis failure:", safeError(nestedError));
      }
    }

    await markWebhookFailed(event.id, processingToken, message);

    throw error;
  }
}
