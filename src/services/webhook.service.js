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
import { createInvoiceForPaidSession } from "./invoice.service.js";
import {
  assertCheckoutMatchesPackage,
  getProductPackage
} from "../config/products.js";

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

function schedulePostPaymentSideEffects({
  session,
  checkoutSession,
  internalSessionId,
  includeMeta = true,
  includeInvoice = true
} = {}) {
  setTimeout(async () => {
    if (includeMeta) {
      try {
        await sendMetaPurchaseEvent({
          email: session?.email,
          eventId: checkoutSession?.id,
          value: Number(checkoutSession?.amount_total || session?.amount_total || 0) / 100,
          currency: String(checkoutSession?.currency || session?.currency || "usd").toUpperCase()
        });
      } catch (metaError) {
        console.error("[meta] purchase event failed after webhook acknowledgement:", {
          message: metaError?.message || metaError,
          internalSessionId,
          stripeSessionId: checkoutSession?.id
        });
      }
    }

    if (includeInvoice) {
      try {
        await createInvoiceForPaidSession({
          session,
          checkoutSession,
          throwOnError: false
        });
      } catch (invoiceError) {
        console.error("[invoice] invoice step failed after webhook acknowledgement:", {
          message: invoiceError?.message || invoiceError,
          internalSessionId,
          stripeSessionId: checkoutSession?.id
        });
      }
    }
  }, 0);
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
      if (sessionRow.payment_status === "paid" && sessionRow.invoice_status !== "issued") {
        schedulePostPaymentSideEffects({
          session: sessionRow,
          checkoutSession,
          internalSessionId,
          includeMeta: false,
          includeInvoice: true
        });
      }

      await markWebhookProcessed(event.id);

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
    const paidSession =
      await markCheckoutRecoveredOrPaid(internalSessionId) || {
        ...sessionRow,
        payment_status: "paid",
        amount_total: checkoutSession.amount_total,
        currency: String(checkoutSession.currency || productPackage.currency).toLowerCase()
      };

    phase = "schedule_post_payment_side_effects";
    schedulePostPaymentSideEffects({
      session: paidSession,
      checkoutSession,
      internalSessionId,
      includeMeta: true,
      includeInvoice: true
    });

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
