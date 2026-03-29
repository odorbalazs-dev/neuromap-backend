import { db } from "../config/db.js";

export async function createSession({
  email,
  name,
  lang,
  payload
}) {
  const result = await db.query(
    `
      INSERT INTO sessions (
        email,
        name,
        lang,
        payload,
        payment_status,
        analysis_status
      )
      VALUES ($1, $2, $3, $4, 'pending', 'pending')
      RETURNING *
    `,
    [email, name, lang, payload]
  );

  return result.rows[0];
}

export async function getSessionById(sessionId) {
  const result = await db.query(
    `
      SELECT
        id,
        email,
        name,
        lang,
        stripe_session_id,
        payment_status,
        analysis_status,
        payload,
        analysis_result,
        error_message,
        paid_at,
        analysis_started_at,
        analysis_completed_at,
        created_at,
        updated_at
      FROM sessions
      WHERE id = $1
      LIMIT 1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function updateStripeSessionId(sessionId, stripeSessionId) {
  const result = await db.query(
    `
      UPDATE sessions
      SET
        stripe_session_id = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [sessionId, stripeSessionId]
  );

  return result.rows[0] || null;
}

export async function markSessionPaid(sessionId) {
  const result = await db.query(
    `
      UPDATE sessions
      SET
        payment_status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
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
      SET
        analysis_status = 'processing',
        error_message = NULL,
        analysis_started_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function markAnalysisDone(sessionId, analysisResult) {
  const result = await db.query(
    `
      UPDATE sessions
      SET
        analysis_status = 'done',
        analysis_result = $2,
        error_message = NULL,
        analysis_completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [sessionId, analysisResult]
  );

  return result.rows[0] || null;
}

export async function markAnalysisFailed(sessionId, errorMessage) {
  const result = await db.query(
    `
      UPDATE sessions
      SET
        analysis_status = 'failed',
        error_message = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [sessionId, errorMessage]
  );

  return result.rows[0] || null;
}