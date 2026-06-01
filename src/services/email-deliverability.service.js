import { db } from "../db/db.js";

const DEFAULT_WINDOW_HOURS = 168;
const MAX_WINDOW_HOURS = 720;
const MAX_RETRY_ATTEMPTS = 3;
const STALE_SENDING_MINUTES = 20;
const OLD_FAILURE_MINUTES = 180;

function clampNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
}

function minutesSince(value) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;

  return Math.max(0, Math.round((Date.now() - timestamp) / 60000));
}

function fromDomain(value) {
  const email = String(value || "").trim();
  const atIndex = email.lastIndexOf("@");

  if (atIndex < 0 || atIndex === email.length - 1) {
    return null;
  }

  return email.slice(atIndex + 1).toLowerCase();
}

function buildConfigChecks() {
  const emailFrom = process.env.EMAIL_FROM || "";
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const fromConfigured = Boolean(emailFrom);
  const domain = fromDomain(emailFrom);

  return {
    resendConfigured,
    fromConfigured,
    fromDomain: domain,
    fromLooksValid: Boolean(domain),
    adminAlertEmailConfigured: Boolean(process.env.ADMIN_ALERT_EMAIL)
  };
}

function buildLevel({ config, metrics }) {
  if (!config.resendConfigured || !config.fromConfigured || !config.fromLooksValid) {
    return "critical";
  }

  if (
    metrics.retryLimitCount > 0 ||
    metrics.staleSendingCount > 0 ||
    (metrics.failedCount >= 3 && metrics.failureRate >= 0.1)
  ) {
    return "critical";
  }

  if (
    metrics.failedCount > 0 ||
    metrics.retryableCount > 0 ||
    metrics.unsentDoneCount > 0 ||
    metrics.oldFailureCount > 0 ||
    metrics.failureRate >= 0.03
  ) {
    return "warning";
  }

  if (metrics.sendingCount > 0) {
    return "active";
  }

  return "healthy";
}

function buildRecommendations({ config, metrics, level }) {
  const recommendations = [];

  if (!config.resendConfigured) {
    recommendations.push("RESEND_API_KEY nincs beallitva, riport email nem kuldheto.");
  }

  if (!config.fromConfigured || !config.fromLooksValid) {
    recommendations.push("EMAIL_FROM hianyzik vagy nem email-szeru. Ellenorizd a Railway valtozot es a kuldo domaint.");
  }

  if (metrics.retryLimitCount > 0) {
    recommendations.push("Van retry limitet elert riport email. Nyisd meg az email panelt, ellenorizd a hibat, majd allitsd alaphelyzetbe vagy kuldd ujra.");
  }

  if (metrics.staleSendingCount > 0) {
    recommendations.push("Van sending statuszban beragadt email. Futtasd az email retry batch-et vagy ellenorizd a worker logot.");
  }

  if (metrics.retryableCount > 0) {
    recommendations.push("Van automatikusan ujraprobalhato email. Inditsd a riport email retry batch-et.");
  }

  if (metrics.failureRate >= 0.1 && metrics.failedCount >= 3) {
    recommendations.push("A hibaarany magas. Ellenorizd a Resend dashboardot, a domain verifikaciot es a bounce/spam jelzeseket.");
  }

  if (level === "healthy") {
    recommendations.push("Nincs azonnali email deliverability teendo. A riport email pipeline stabilnak tunik.");
  }

  return recommendations;
}

function normalizeSession(row = {}) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    lang: row.lang,
    payment_status: row.payment_status,
    analysis_status: row.analysis_status,
    report_email_status: row.report_email_status || "not_sent",
    report_email_sent_at: row.report_email_sent_at,
    report_email_last_attempt_at: row.report_email_last_attempt_at,
    report_email_error: row.report_email_error,
    report_email_provider_id: row.report_email_provider_id,
    report_email_attempts: Number(row.report_email_attempts || 0),
    updated_at: row.updated_at,
    created_at: row.created_at
  };
}

export async function buildEmailDeliverabilityMonitor(options = {}) {
  const windowHours = clampNumber(
    options.windowHours ?? options.hours,
    DEFAULT_WINDOW_HOURS,
    1,
    MAX_WINDOW_HOURS
  );

  const limit = clampNumber(options.limit, 20, 1, 100);

  const [summaryResult, errorsResult, issuesResult] = await Promise.all([
    db.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE payment_status = 'paid'
            AND analysis_status = 'done'
            AND analysis_result IS NOT NULL
            AND LENGTH(TRIM(analysis_result)) > 0
        )::int AS done_report_count,
        COUNT(*) FILTER (
          WHERE report_email_status = 'sent'
        )::int AS sent_count,
        COUNT(*) FILTER (
          WHERE report_email_status = 'failed'
        )::int AS failed_count,
        COUNT(*) FILTER (
          WHERE report_email_status = 'sending'
        )::int AS sending_count,
        COUNT(*) FILTER (
          WHERE payment_status = 'paid'
            AND analysis_status = 'done'
            AND analysis_result IS NOT NULL
            AND LENGTH(TRIM(analysis_result)) > 0
            AND COALESCE(report_email_status, 'not_sent') IN ('not_sent', 'sending')
        )::int AS unsent_done_count,
        COUNT(*) FILTER (
          WHERE payment_status = 'paid'
            AND analysis_status = 'done'
            AND analysis_result IS NOT NULL
            AND LENGTH(TRIM(analysis_result)) > 0
            AND COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) < $2
        )::int AS retryable_count,
        COUNT(*) FILTER (
          WHERE payment_status = 'paid'
            AND analysis_status = 'done'
            AND analysis_result IS NOT NULL
            AND LENGTH(TRIM(analysis_result)) > 0
            AND COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) >= $2
        )::int AS retry_limit_count,
        COUNT(*) FILTER (
          WHERE report_email_status = 'sending'
            AND report_email_last_attempt_at < NOW() - ($3::int * INTERVAL '1 minute')
        )::int AS stale_sending_count,
        COUNT(*) FILTER (
          WHERE report_email_status = 'failed'
            AND report_email_last_attempt_at < NOW() - ($4::int * INTERVAL '1 minute')
        )::int AS old_failure_count,
        COUNT(*) FILTER (
          WHERE report_email_status = 'sent'
            AND report_email_provider_id IS NOT NULL
        )::int AS sent_with_provider_id_count,
        MAX(report_email_sent_at) AS last_sent_at,
        MAX(report_email_last_attempt_at) AS last_attempt_at
      FROM sessions
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 hour')
         OR report_email_last_attempt_at >= NOW() - ($1::int * INTERVAL '1 hour')
         OR report_email_sent_at >= NOW() - ($1::int * INTERVAL '1 hour')
      `,
      [
        windowHours,
        MAX_RETRY_ATTEMPTS,
        STALE_SENDING_MINUTES,
        OLD_FAILURE_MINUTES
      ]
    ),
    db.query(
      `
      SELECT
        COALESCE(NULLIF(TRIM(report_email_error), ''), 'Unknown report email error') AS error,
        COUNT(*)::int AS count,
        MAX(report_email_last_attempt_at) AS last_seen_at
      FROM sessions
      WHERE report_email_status = 'failed'
        AND (
          report_email_last_attempt_at >= NOW() - ($1::int * INTERVAL '1 hour')
          OR updated_at >= NOW() - ($1::int * INTERVAL '1 hour')
        )
      GROUP BY 1
      ORDER BY count DESC, last_seen_at DESC NULLS LAST
      LIMIT 8
      `,
      [windowHours]
    ),
    db.query(
      `
      SELECT
        id,
        email,
        name,
        lang,
        payment_status,
        analysis_status,
        report_email_status,
        report_email_sent_at,
        report_email_last_attempt_at,
        report_email_error,
        report_email_provider_id,
        report_email_attempts,
        updated_at,
        created_at
      FROM sessions
      WHERE payment_status = 'paid'
        AND analysis_status = 'done'
        AND COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending')
      ORDER BY
        CASE
          WHEN COALESCE(report_email_attempts, 0) >= $2 THEN 1
          WHEN report_email_status = 'failed' THEN 2
          WHEN report_email_status = 'sending' THEN 3
          ELSE 4
        END,
        report_email_last_attempt_at DESC NULLS LAST,
        updated_at DESC
      LIMIT $1
      `,
      [limit, MAX_RETRY_ATTEMPTS]
    )
  ]);

  const row = summaryResult.rows[0] || {};
  const attemptedCount =
    Number(row.sent_count || 0) +
    Number(row.failed_count || 0);

  const metrics = {
    doneReportCount: Number(row.done_report_count || 0),
    sentCount: Number(row.sent_count || 0),
    failedCount: Number(row.failed_count || 0),
    sendingCount: Number(row.sending_count || 0),
    unsentDoneCount: Number(row.unsent_done_count || 0),
    retryableCount: Number(row.retryable_count || 0),
    retryLimitCount: Number(row.retry_limit_count || 0),
    staleSendingCount: Number(row.stale_sending_count || 0),
    oldFailureCount: Number(row.old_failure_count || 0),
    sentWithProviderIdCount: Number(row.sent_with_provider_id_count || 0),
    attemptedCount,
    successRate: attemptedCount ? Number(row.sent_count || 0) / attemptedCount : null,
    failureRate: attemptedCount ? Number(row.failed_count || 0) / attemptedCount : null,
    providerIdCoverage: Number(row.sent_count || 0)
      ? Number(row.sent_with_provider_id_count || 0) / Number(row.sent_count || 0)
      : null,
    lastSentAt: row.last_sent_at || null,
    lastSentMinutesAgo: minutesSince(row.last_sent_at),
    lastAttemptAt: row.last_attempt_at || null,
    lastAttemptMinutesAgo: minutesSince(row.last_attempt_at)
  };

  const config = buildConfigChecks();
  const level = buildLevel({ config, metrics });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    window: {
      hours: windowHours,
      maxRetryAttempts: MAX_RETRY_ATTEMPTS,
      staleSendingMinutes: STALE_SENDING_MINUTES,
      oldFailureMinutes: OLD_FAILURE_MINUTES
    },
    level,
    config,
    metrics,
    topErrors: errorsResult.rows.map((errorRow) => ({
      error: errorRow.error,
      count: Number(errorRow.count || 0),
      lastSeenAt: errorRow.last_seen_at || null,
      lastSeenMinutesAgo: minutesSince(errorRow.last_seen_at)
    })),
    issues: issuesResult.rows.map(normalizeSession),
    recommendations: buildRecommendations({ config, metrics, level })
  };
}
