import { db } from "../db/db.js";
import { constructStripeEvent } from "./stripe.service.js";
import {
  getSessionById,
  markSessionPaid,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed,
  markCheckoutRecoveredOrPaid
} from "./session.service.js";
import { generateAnalysis } from "./analysis.service.js";
import { sendReportEmail } from "./email.service.js";
import { sendMetaPurchaseEvent } from "./meta.service.js";

async function insertWebhookEvent(event) {
  const result = await db.query(
    `
    INSERT INTO webhook_events (provider, event_id, event_type, payload, status)
    VALUES ($1, $2, $3, $4, 'received')
    ON CONFLICT (event_id) DO NOTHING
    RETURNING *
    `,
    ["stripe", event.id, event.type, event]
  );

  return result.rows[0] || null;
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
  const inserted = await insertWebhookEvent(event);

  if (!inserted) {
    return {
      received: true,
      duplicate: true
    };
  }

  let internalSessionId = null;
  let phase = "received";

  try {
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

    phase = "mark_processing";
    const processingRow = await markAnalysisProcessing(internalSessionId);

    if (!processingRow) {
      await markWebhookProcessed(event.id);

      return {
        received: true,
        skipped: true,
        reason: "analysis_not_processable"
      };
    }

    phase = "generate_analysis";
    const resultText = await generateAnalysis({
      ...(sessionRow.payload || {}),
      lang: sessionRow.lang
    });

    phase = "save_analysis";
    await markAnalysisDone(internalSessionId, resultText);

    phase = "send_email";
    await sendReportEmail({
      to: sessionRow.email,
      lang: sessionRow.lang,
      name: sessionRow.name,
      reportText: resultText,
      payload: sessionRow.payload
    });

    phase = "mark_webhook_processed";
    await markWebhookProcessed(event.id);

    return {
      received: true,
      processed: true,
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