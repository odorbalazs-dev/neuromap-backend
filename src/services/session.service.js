import { randomUUID } from "crypto";
import { db } from "../db/db.js";

export async function createSession({ email, name, lang, payload }) {
  const id = randomUUID();

  const result = await db.query(
    `
    INSERT INTO sessions (
      id,
      email,
      name,
      lang,
      payload,
      payment_status,
      analysis_status,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, 'pending', 'pending', NOW())
    RETURNING *
    `,
    [id, email, name || "", lang || "en", payload || {}]
  );

  return result.rows[0];
}

export async function updateStripeSessionId(sessionId, stripeSessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET stripe_session_id = $2
    WHERE id = $1
    RETURNING *
    `,
    [sessionId, stripeSessionId]
  );

  return result.rows[0] || null;
}

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

export async function markSessionPaid(sessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET payment_status = 'paid',
        paid_at = COALESCE(paid_at, NOW())
    WHERE id = $1
    RETURNING *
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function markAnalysisProcessing(sessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'processing',
        analysis_started_at = COALESCE(analysis_started_at, NOW()),
        error_message = NULL
    WHERE id = $1
      AND analysis_status IS DISTINCT FROM 'done'
    RETURNING *
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function markAnalysisDone(sessionId, resultText) {
  const result = await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'done',
        analysis_result = $2,
        error_message = NULL,
        analysis_completed_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [sessionId, resultText]
  );

  return result.rows[0] || null;
}

export async function markAnalysisFailed(sessionId, errorMessage) {
  const result = await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'failed',
        error_message = $2
    WHERE id = $1
      AND analysis_status IS DISTINCT FROM 'done'
    RETURNING *
    `,
    [sessionId, errorMessage || "Analysis failed"]
  );

  return result.rows[0] || null;
}