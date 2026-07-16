import { db } from "../db/db.js";

const RESTRICTION_MESSAGE = "Processing restricted for data-protection reasons.";

export class ProcessingRestrictedError extends Error {
  constructor(reason = RESTRICTION_MESSAGE) {
    super(reason);
    this.name = "ProcessingRestrictedError";
    this.code = "PROCESSING_RESTRICTED";
    this.status = 409;
    this.terminal = true;
  }
}

export function isSessionProcessingRestricted(session) {
  return Boolean(
    session?.processing_restricted_at ||
    session?.sensitive_data_erased_at ||
    session?.data_redacted_at
  );
}

export function assertSessionProcessingAllowedRecord(session) {
  if (!session) {
    const error = new Error("Session not found");
    error.status = 404;
    throw error;
  }

  if (isSessionProcessingRestricted(session)) {
    throw new ProcessingRestrictedError(
      session.processing_restriction_reason || RESTRICTION_MESSAGE
    );
  }

  return session;
}

export async function assertSessionProcessingAllowed(
  sessionId,
  { executor = db, lock = false } = {}
) {
  const result = await executor.query(
    `
    SELECT
      id,
      processing_restricted_at,
      processing_restriction_reason,
      sensitive_data_erased_at,
      data_redacted_at
    FROM sessions
    WHERE id = $1
    ${lock ? "FOR UPDATE" : ""}
    `,
    [sessionId]
  );

  return assertSessionProcessingAllowedRecord(result.rows[0]);
}

export async function restrictSessionProcessing(
  sessionId,
  reason = RESTRICTION_MESSAGE,
  { executor = db } = {}
) {
  const safeReason = String(reason || RESTRICTION_MESSAGE).slice(0, 1000);

  const sessionResult = await executor.query(
    `
    UPDATE sessions
    SET processing_restricted_at = COALESCE(processing_restricted_at, NOW()),
        processing_restriction_reason = $2,
        analysis_status = CASE
          WHEN analysis_status IN ('pending', 'queued', 'processing', 'failed') THEN 'failed'
          ELSE analysis_status
        END,
        report_email_status = CASE
          WHEN report_email_status = 'sent' THEN 'sent'
          ELSE 'failed'
        END,
        report_email_error = CASE
          WHEN report_email_status = 'sent' THEN report_email_error
          ELSE $3
        END,
        follow_up_email_status = CASE
          WHEN follow_up_email_status = 'sent' THEN 'sent'
          ELSE 'failed'
        END,
        follow_up_email_error = CASE
          WHEN follow_up_email_status = 'sent' THEN follow_up_email_error
          ELSE $3
        END,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [sessionId, safeReason, RESTRICTION_MESSAGE]
  );

  if (!sessionResult.rows[0]) {
    const error = new Error("Session not found");
    error.status = 404;
    throw error;
  }

  await executor.query(
    `
    UPDATE analysis_jobs
    SET status = 'cancelled',
        locked_at = NULL,
        locked_by = NULL,
        lease_token = NULL,
        heartbeat_at = NULL,
        last_error = $2,
        updated_at = NOW()
    WHERE session_id = $1
      AND status IN ('queued', 'processing', 'failed')
    `,
    [sessionId, RESTRICTION_MESSAGE]
  );

  await executor.query(
    `
    UPDATE observation_follow_ups follow_up
    SET status = 'cancelled',
        error_message = $2,
        updated_at = NOW()
    FROM observation_programs program
    WHERE follow_up.program_id = program.id
      AND program.session_id = $1
      AND follow_up.status <> 'sent'
    `,
    [sessionId, RESTRICTION_MESSAGE]
  );

  await executor.query(
    `
    UPDATE observation_trend_reports trend
    SET status = 'failed',
        error_message = $2,
        updated_at = NOW()
    FROM observation_programs program
    WHERE trend.program_id = program.id
      AND program.session_id = $1
      AND trend.status IN ('pending', 'ready')
    `,
    [sessionId, RESTRICTION_MESSAGE]
  );

  await executor.query(
    `
    UPDATE observation_programs
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE session_id = $1
      AND status = 'active'
    `,
    [sessionId]
  );

  return sessionResult.rows[0];
}

export async function eraseSessionSensitiveData(
  sessionId,
  reason = "Sensitive data erased following a data-subject request."
) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const locked = await client.query(
      "SELECT * FROM sessions WHERE id = $1 FOR UPDATE",
      [sessionId]
    );

    if (!locked.rows[0]) {
      const error = new Error("Session not found");
      error.status = 404;
      throw error;
    }

    await restrictSessionProcessing(sessionId, reason, { executor: client });

    await client.query(
      "DELETE FROM observation_programs WHERE session_id = $1",
      [sessionId]
    );

    const result = await client.query(
      `
      UPDATE sessions
      SET email = CONCAT('erased+', id::text, '@privacy.invalid'),
          name = '',
          payload = '{}'::jsonb,
          analysis_result = NULL,
          consent_record = '{}'::jsonb,
          public_access_token_hash = NULL,
          checkout_url = NULL,
          recovery_token = NULL,
          error_message = NULL,
          report_email_error = NULL,
          report_email_provider_id = NULL,
          follow_up_email_error = NULL,
          contract_confirmation_provider_id = NULL,
          contract_confirmation_error = NULL,
          invoice_error = NULL,
          data_redacted_at = COALESCE(data_redacted_at, NOW()),
          data_redaction_reason = $2,
          sensitive_data_erased_at = COALESCE(sensitive_data_erased_at, NOW()),
          updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        payment_status,
        invoice_status,
        processing_restricted_at,
        sensitive_data_erased_at
      `,
      [sessionId, String(reason || "Sensitive data erased").slice(0, 1000)]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
