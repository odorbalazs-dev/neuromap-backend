import { db } from "../config/db.js";
import { createId } from "../utils/id.js";

export async function createPendingSession(payload) {
  const id = createId();

  const query = `
    INSERT INTO sessions (
      id,
      email,
      name,
      lang,
      payment_status,
      analysis_status,
      payload
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    id,
    payload.email,
    payload.name,
    payload.lang,
    "pending",
    "pending",
    JSON.stringify(payload)
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
}

export async function getSessionById(id) {
  const { rows } = await db.query(
    `SELECT * FROM sessions WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function getSessionByStripeSessionId(stripeSessionId) {
  const { rows } = await db.query(
    `SELECT * FROM sessions WHERE stripe_session_id = $1 LIMIT 1`,
    [stripeSessionId]
  );
  return rows[0] || null;
}

export async function attachStripeSessionId(id, stripeSessionId) {
  const { rows } = await db.query(
    `UPDATE sessions SET stripe_session_id = $1 WHERE id = $2 RETURNING *`,
    [stripeSessionId, id]
  );
  return rows[0];
}

export async function markSessionPaid(id) {
  const { rows } = await db.query(
    `UPDATE sessions SET payment_status = 'paid' WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
}

export async function markAnalysisProcessing(id) {
  const { rows } = await db.query(
    `UPDATE sessions SET analysis_status = 'processing' WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
}

export async function markAnalysisDone(id, resultText) {
  const { rows } = await db.query(
    `UPDATE sessions
     SET analysis_status = 'done', result_text = $2
     WHERE id = $1
     RETURNING *`,
    [id, resultText]
  );
  return rows[0];
}

export async function markAnalysisFailed(id, errorMessage) {
  const { rows } = await db.query(
    `UPDATE sessions
     SET analysis_status = 'failed', error_message = $2
     WHERE id = $1
     RETURNING *`,
    [id, errorMessage]
  );
  return rows[0];
}