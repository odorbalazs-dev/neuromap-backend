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
import { sendContractConfirmationForSession } from "./contract-confirmation.service.js";
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

async function markWebhookProcessed(eventId, processingToken) {
  await db.query(
    `
    UPDATE webhook_events
    SET status = 'processed',
        processed_at = NOW(),
        error_message = NULL,
        processing_token = NULL
    WHERE event_id = $1
      AND processing_token = $2
    `,
    [eventId, processingToken]
  );
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

async function runPostPaymentSideEffects({
  session,
  checkoutSession,
  internalSessionId,
  includeMeta = true,
  includeInvoice = true,
  includeContractConfirmation = true
} = {}) {
  if (includeContractConfirmation) {
    try {
      await sendContractConfirmationForSession(internalSessionId);
    } catch (confirmationError) {
      console.error("[contract-confirmation] step failed after webhook acknowledgement:", {
        message: confirmationError?.message || confirmationError,
        internalSessionId,
        stripeSessionId: checkoutSession?.id
      });
    }
  }

  if (includeMeta) {
    try {
      await sendMetaPurchaseEvent({
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
}

function schedulePostPaymentSideEffects(options) {
  console.log("[webhook] schedule_post_payment_side_effects", {
    internalSessionId: options?.internalSessionId || null,
    stripeSessionId: options?.checkoutSession?.id || null
  });

  void runPostPaymentSideEffects(options).catch((error) => {
    console.error("[webhook] post_payment_side_effects_failed", {
      message: error?.message || error,
      internalSessionId: options?.internalSessionId || null,
      stripeSessionId: options?.checkoutSession?.id || null
    });
  });
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
      const confirmationMissing =
        sessionRow.contract_confirmation_status !== "sent";
      const invoiceMissing = sessionRow.invoice_status !== "issued";

      if (sessionRow.payment_status === "paid" && (invoiceMissing || confirmationMissing)) {
        schedulePostPaymentSideEffects({
          session: sessionRow,
          checkoutSession,
          internalSessionId,
          includeMeta: false,
          includeInvoice: invoiceMissing,
          includeContractConfirmation: confirmationMissing
        });
      }

      await markWebhookProcessed(event.id, processingToken);

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

    phase = "queue_analysis";

    const queuedRow = await markAnalysisQueued(internalSessionId);

    if (!queuedRow) {
      throw new Error("Could not queue analysis job.");
    }

    await enqueueAnalysisJob(internalSessionId);

    await markWebhookProcessed(event.id, processingToken);

    schedulePostPaymentSideEffects({
      session: paidSession,
      checkoutSession,
      internalSessionId,
      includeMeta: true,
      includeInvoice: true,
      includeContractConfirmation: true
    });

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

    await markWebhookFailed(event.id, processingToken, message);

    throw error;
  }
}
