import { db } from "../db/db.js";
import { constructStripeEvent } from "./stripe.service.js";
import {
  getSessionById,
  markSessionPaid,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed
} from "./session.service.js";
import { generateAnalysis } from "./analysis.service.js";
import { sendReportEmail } from "./email.service.js";

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

export async function handleStripeWebhook(rawBody, signature) {
  const event = constructStripeEvent(rawBody, signature);

  const inserted = await insertWebhookEvent(event);

  if (!inserted) {
    return {
      received: true,
      duplicate: true
    };
  }

  try {
    if (event.type !== "checkout.session.completed") {
      await markWebhookProcessed(event.id);
      return {
        received: true,
        ignored: true
      };
    }

    const checkoutSession = event.data.object;
    const internalSessionId = checkoutSession.metadata?.internalSessionId;

    if (!internalSessionId) {
      throw new Error("Missing internalSessionId in Stripe metadata.");
    }

    const sessionRow = await getSessionById(internalSessionId);

    if (!sessionRow) {
      throw new Error("Session not found.");
    }

    if (sessionRow.payment_status !== "paid") {
      await markSessionPaid(internalSessionId);
    }

    if (sessionRow.analysis_status === "done") {
      await markWebhookProcessed(event.id);
      return {
        received: true,
        skipped: true
      };
    }

    await markAnalysisProcessing(internalSessionId);

const resultText = await generateAnalysis({
  ...sessionRow.payload,
  lang: sessionRow.lang
});

await markAnalysisDone(internalSessionId, resultText);

await sendReportEmail({
  to: sessionRow.email,
  lang: sessionRow.lang,
  name: sessionRow.name,
  reportText: resultText
});

    await markWebhookProcessed(event.id);

    return {
      received: true,
      processed: true
    };
  } catch (error) {
    const internalSessionId = event?.data?.object?.metadata?.internalSessionId;

    if (internalSessionId) {
      try {
        await markAnalysisFailed(
          internalSessionId,
          error.message || "Webhook processing failed"
        );
      } catch (nestedError) {
        console.error("Failed to persist analysis failure:", nestedError);
      }
    }

    await markWebhookFailed(
      event.id,
      error.message || "Webhook processing failed"
    );

    throw error;
  }
}