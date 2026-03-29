import { db } from "../infrastructure/db/db.js";
import { randomUUID } from "crypto";

/**
 * Session létrehozása
 */
export async function createSession({ email, name, lang, payload }) {
  const id = randomUUID();

  const result = await db.query(
    `
    INSERT INTO sessions (id, email, name, lang, payload)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [id, email, name, lang, payload]
  );

  return result.rows[0];
}

/**
 * Stripe session ID mentése
 */
export async function updateStripeSessionId(sessionId, stripeSessionId) {
  await db.query(
    `
    UPDATE sessions
    SET stripe_session_id = $2
    WHERE id = $1
    `,
    [sessionId, stripeSessionId]
  );
}

/**
 * Session lekérdezése ID alapján
 */
export async function getSessionById(sessionId) {
  const result = await db.query(
    `
    SELECT *
    FROM sessions
    WHERE id = $1
    LIMIT 1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

/**
 * Payment státusz: paid
 */
export async function markSessionPaid(sessionId) {
  await db.query(
    `
    UPDATE sessions
    SET payment_status = 'paid'
    WHERE id = $1
    `,
    [sessionId]
  );
}

/**
 * Analysis státusz: processing
 */
export async function markAnalysisProcessing(sessionId) {
  await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'processing'
    WHERE id = $1
    `,
    [sessionId]
  );
}

/**
 * Analysis kész + eredmény mentése
 */
export async function markAnalysisDone(sessionId, resultText) {
  await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'done',
        result_text = $2,
        error_message = NULL
    WHERE id = $1
    `,
    [sessionId, resultText]
  );
}

/**
 * Analysis hiba mentése
 */
export async function markAnalysisFailed(sessionId, errorMessage) {
  await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'failed',
        error_message = $2
    WHERE id = $1
    `,
    [sessionId, errorMessage]
  );
}