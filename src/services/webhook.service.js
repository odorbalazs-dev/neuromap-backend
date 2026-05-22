import { enqueueAnalysisJob } from "./analysis-queue.service.js";
import { db } from "../db/db.js";
import { constructStripeEvent } from "./stripe.service.js";
import {
  getSessionById,
  markSessionPaid,
  markAnalysisQueued,
  markAnalysisFailed,
  markCheckoutRecoveredOrPaid
} from "./session.service.js";
import { sendMetaPurchaseEvent } from "./meta.service.js";

async function registerWebhookEvent(event) {
  const result = await db.query(
    `
    INSERT INTO webhook_events (provider, event_id, event_type, payload, status)
    VALUES ($1, $2, $3, $4, 'received')
    ON CONFLICT (event_id)
    DO UPDATE SET
      event_type = EXCLUDED.event_type,
      payload = EXCLUDED.payload,
      status = CASE
        WHEN webhook_events.status = 'processed' THEN 'processed'
        ELSE 'received'
      END,
      error_message = CASE
        WHEN webhook_events.status = 'processed' THEN webhook_events.error_message
        ELSE NULL
      END
    RETURNING *
    `,
    ["stripe", event.id, event.type, event]
  );

  return result.rows[0] || null;
}

async function markWebhookProcessing(eventId) {
  await db.query(
    `
    UPDATE webhook_events
    SET status = 'processing',
        error_message = NULL
    WHERE event_id = $1
      AND status != 'processed'
    `,
    [eventId]
  );
}

async function markWebhookProcessed(eventId) {
  await db.query(
    `
    UPDATE webhook_events
    SET status = 'processed',
        processed_at = NOW(),
        error_message = NULL
    WHERE event_id = $1
    `,
    [eventId]
  );
}

async function markWebhookFailed(eventId, errorMessage) {
  await db.query(
    `
    UPDATE webhook_events
    SET status = 'failed',
        error_message = $2
    WHERE event_id = $1
    `,
    [eventId, errorMessage]
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
  const webhookRow = await registerWebhookEvent(event);

  if (webhookRow?.status === "processed") {
    return {
      received: true,
      duplicate: true,
      alreadyProcessed: true
    };
  }

  let internalSessionId = null;
  let phase = "received";

  try {
    await markWebhookProcessing(event.id);

    if (event.type !== "checkout.session.completed") {
      await markWebhookProcessed(event.id);

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
      await markWebhookProcessed(event.id);

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

    if (sessionRow.analysis_status === "done") {
      await markWebhookProcessed(event.id);

      return {
        received: true,
        skipped: true,
        reason: "analysis_already_done"
      };
    }

    phase = "mark_paid";
    await markSessionPaid(internalSessionId);

    phase = "clear_recovery_state";
    await markCheckoutRecoveredOrPaid(internalSessionId);

    phase = "send_meta_purchase";
    try {
      await sendMetaPurchaseEvent({
        email: sessionRow.email,
        eventId: checkoutSession.id,
        value: 5,
        currency: "USD"
      });
    } catch (metaError) {
      console.error("[meta] purchase event failed, continuing webhook:", {
        message: metaError?.message || metaError,
        internalSessionId,
        stripeSessionId: checkoutSession.id
      });
    }

    phase = "queue_analysis";

    const queuedRow = await markAnalysisQueued(internalSessionId);

    if (!queuedRow) {
      throw new Error("Could not queue analysis job.");
    }

    await enqueueAnalysisJob(internalSessionId);

    await markWebhookProcessed(event.id);

    return {
      received: true,
      processed: true,
      queued: true,
      sessionId: internalSessionId
    };
  } catch (error) {
    const message = `[${phase}] ${error?.message || "Webhook processing failed"}`;

    console.error("Webhook processing failed:", {
      eventId: event?.id,
      eventType: event?.type,
      internalSessionId,
      phase,
      error: error?.message || error
    });

    if (internalSessionId) {
      try {
        const latestSession = await getSessionById(internalSessionId);

        if (latestSession?.analysis_status !== "done") {
          await markAnalysisFailed(internalSessionId, message);
        }
      } catch (nestedError) {
        console.error("Failed to persist analysis failure:", nestedError);
      }
    }

    await markWebhookFailed(event.id, message);

    throw error;
  }
}
