import { db } from "../db/db.js";
import { sendFollowUpEmail } from "./email.service.js";
import { assertSessionProcessingAllowed } from "./data-governance.service.js";

function number(value) {
  return Number(value || 0);
}

function getDetectedRisk(row) {
  const payload = row?.payload || {};
  return (
    payload.detectedRisk ||
    payload.detected_risk ||
    payload?.payload?.detectedRisk ||
    payload?.payload?.specificProfile?.kind ||
    null
  );
}

function compactRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    lang: row.lang || "en",
    detectedRisk: getDetectedRisk(row),
    status: row.follow_up_email_status || "not_due",
    dueAt: row.follow_up_email_due_at,
    sentAt: row.follow_up_email_sent_at,
    lastAttemptAt: row.follow_up_email_last_attempt_at,
    attempts: number(row.follow_up_email_attempts),
    error: row.follow_up_email_error || "",
    reportEmailSentAt: row.report_email_sent_at,
    createdAt: row.created_at
  };
}

export async function getFollowUpEmailStatus({ limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit || 20), 1), 100);

  const summaryResult = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE report_email_status = 'sent')::int AS eligible,
      COUNT(*) FILTER (WHERE follow_up_email_status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE follow_up_email_status = 'failed')::int AS failed,
      COUNT(*) FILTER (
        WHERE report_email_status = 'sent'
          AND follow_up_email_sent_at IS NULL
          AND COALESCE(follow_up_email_due_at, report_email_sent_at + INTERVAL '3 days') <= NOW()
      )::int AS due,
      COUNT(*) FILTER (
        WHERE report_email_status = 'sent'
          AND follow_up_email_sent_at IS NULL
          AND COALESCE(follow_up_email_due_at, report_email_sent_at + INTERVAL '3 days') > NOW()
      )::int AS scheduled
    FROM sessions
    WHERE processing_restricted_at IS NULL
      AND sensitive_data_erased_at IS NULL
      AND data_redacted_at IS NULL;
  `);

  const rowsResult = await db.query(
    `
      SELECT
        id, name, email, lang, payload, report_email_sent_at,
        analysis_completed_at, paid_at, created_at,
        follow_up_email_status, follow_up_email_due_at, follow_up_email_sent_at,
        follow_up_email_last_attempt_at, follow_up_email_attempts, follow_up_email_error
      FROM sessions
      WHERE report_email_status = 'sent'
        AND processing_restricted_at IS NULL
        AND sensitive_data_erased_at IS NULL
        AND data_redacted_at IS NULL
      ORDER BY
        follow_up_email_sent_at ASC NULLS FIRST,
        COALESCE(follow_up_email_due_at, report_email_sent_at + INTERVAL '3 days') ASC NULLS LAST,
        created_at DESC
      LIMIT $1::int;
    `,
    [safeLimit]
  );

  const summary = summaryResult.rows[0] || {};

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      eligible: number(summary.eligible),
      due: number(summary.due),
      scheduled: number(summary.scheduled),
      sent: number(summary.sent),
      failed: number(summary.failed)
    },
    items: rowsResult.rows.map(compactRow)
  };
}

export async function processDueFollowUpEmails({ limit = 10, maxAttempts = 3 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit || 10), 1), 50);
  const safeMaxAttempts = Math.min(Math.max(Number(maxAttempts || 3), 1), 10);

  const candidates = await db.query(
    `
      SELECT
        id, name, email, lang, payload, report_email_sent_at,
        follow_up_email_status, follow_up_email_due_at,
        follow_up_email_attempts
      FROM sessions
      WHERE report_email_status = 'sent'
        AND follow_up_email_sent_at IS NULL
        AND processing_restricted_at IS NULL
        AND sensitive_data_erased_at IS NULL
        AND data_redacted_at IS NULL
        AND COALESCE(follow_up_email_due_at, report_email_sent_at + INTERVAL '3 days') <= NOW()
        AND COALESCE(follow_up_email_attempts, 0) < $2::int
      ORDER BY COALESCE(follow_up_email_due_at, report_email_sent_at + INTERVAL '3 days') ASC
      LIMIT $1::int;
    `,
    [safeLimit, safeMaxAttempts]
  );

  const items = [];

  for (const row of candidates.rows) {
    const lock = await db.query(
      `
        UPDATE sessions
        SET
          follow_up_email_status = 'sending',
          follow_up_email_last_attempt_at = NOW(),
          follow_up_email_attempts = COALESCE(follow_up_email_attempts, 0) + 1,
          follow_up_email_error = NULL
        WHERE id = $1
          AND follow_up_email_sent_at IS NULL
          AND processing_restricted_at IS NULL
          AND sensitive_data_erased_at IS NULL
          AND data_redacted_at IS NULL
        RETURNING *;
      `,
      [row.id]
    );

    const locked = lock.rows[0];
    if (!locked) continue;

    try {
      await assertSessionProcessingAllowed(locked.id);

      await sendFollowUpEmail({
        to: locked.email,
        name: locked.name,
        lang: locked.lang || "en",
        detectedRisk: getDetectedRisk(locked)
      });

      await db.query(
        `
          UPDATE sessions
          SET
            follow_up_email_status = 'sent',
            follow_up_email_sent_at = NOW(),
            follow_up_email_error = NULL
          WHERE id = $1;
        `,
        [locked.id]
      );

      items.push({ id: locked.id, email: locked.email, ok: true });
    } catch (error) {
      const message = String(error?.message || "Follow-up email failed").slice(0, 500);

      await db.query(
        `
          UPDATE sessions
          SET
            follow_up_email_status = 'failed',
            follow_up_email_error = $2
          WHERE id = $1;
        `,
        [locked.id, message]
      );

      items.push({ id: locked.id, email: locked.email, ok: false, error: message });
    }
  }

  return {
    processed: items.length,
    sent: items.filter((item) => item.ok).length,
    failed: items.filter((item) => !item.ok).length,
    items
  };
}
