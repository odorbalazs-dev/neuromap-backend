import { randomUUID, randomBytes } from "crypto";
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

export async function markCheckoutStarted(sessionId, checkoutUrl) {
  const recoveryToken = randomBytes(32).toString("hex");

  const result = await db.query(
    `
    UPDATE sessions
    SET checkout_started_at = COALESCE(checkout_started_at, NOW()),
        checkout_url = $2,
        recovery_token = COALESCE(recovery_token, $3)
    WHERE id = $1
    RETURNING *
    `,
    [sessionId, checkoutUrl || null, recoveryToken]
  );

  return result.rows[0] || null;
}

export async function markCheckoutCancelledByStripeSessionId(stripeSessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET checkout_cancelled_at = COALESCE(checkout_cancelled_at, NOW())
    WHERE stripe_session_id = $1
      AND payment_status IS DISTINCT FROM 'paid'
    RETURNING *
    `,
    [stripeSessionId]
  );

  return result.rows[0] || null;
}

export async function getRecoverableCheckoutSessions({ olderThanMinutes = 30, limit = 50 } = {}) {
  const result = await db.query(
    `
    SELECT *
    FROM sessions
    WHERE payment_status IS DISTINCT FROM 'paid'
      AND checkout_started_at IS NOT NULL
      AND checkout_url IS NOT NULL
      AND recovery_token IS NOT NULL
      AND recovery_email_sent_at IS NULL
      AND checkout_started_at < NOW() - ($1::int * INTERVAL '1 minute')
    ORDER BY checkout_started_at ASC
    LIMIT $2
    `,
    [olderThanMinutes, limit]
  );

  return result.rows;
}

export async function markRecoveryEmailSent(sessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET recovery_email_sent_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [sessionId]
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

export async function markAnalysisQueued(sessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'queued',
        error_message = NULL,
        report_email_status = 'not_sent',
        report_email_sent_at = NULL,
        report_email_last_attempt_at = NULL,
        report_email_error = NULL,
        report_email_provider_id = NULL,
        report_email_attempts = 0
    WHERE id = $1
      AND payment_status = 'paid'
      AND analysis_status IS DISTINCT FROM 'done'
    RETURNING *
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function getNextQueuedAnalysisSession() {
  const result = await db.query(
    `
    UPDATE sessions
    SET analysis_status = 'processing',
        analysis_started_at = COALESCE(analysis_started_at, NOW()),
        error_message = NULL
    WHERE id = (
      SELECT id
      FROM sessions
      WHERE payment_status = 'paid'
        AND analysis_status IN ('queued', 'failed')
      ORDER BY paid_at ASC NULLS LAST, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
    `
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

export async function markReportEmailSending(sessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET report_email_status = 'sending',
        report_email_last_attempt_at = NOW(),
        report_email_error = NULL,
        report_email_attempts = report_email_attempts + 1
    WHERE id = $1
    RETURNING *
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function markReportEmailSent(sessionId, providerId = null) {
  const result = await db.query(
    `
    UPDATE sessions
    SET report_email_status = 'sent',
        report_email_sent_at = NOW(),
        report_email_last_attempt_at = COALESCE(report_email_last_attempt_at, NOW()),
        report_email_error = NULL,
        report_email_provider_id = $2
    WHERE id = $1
    RETURNING *
    `,
    [sessionId, providerId]
  );

  return result.rows[0] || null;
}

export async function markReportEmailFailed(sessionId, errorMessage) {
  const result = await db.query(
    `
    UPDATE sessions
    SET report_email_status = 'failed',
        report_email_last_attempt_at = COALESCE(report_email_last_attempt_at, NOW()),
        report_email_error = $2
    WHERE id = $1
    RETURNING *
    `,
    [sessionId, errorMessage || "Report email failed"]
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

export async function markCheckoutRecoveredOrPaid(sessionId) {
  const result = await db.query(
    `
    UPDATE sessions
    SET checkout_cancelled_at = NULL
    WHERE id = $1
    RETURNING *
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}
