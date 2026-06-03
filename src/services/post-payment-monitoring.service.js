import { db } from "../db/db.js";

const DEFAULT_WINDOW_HOURS = 168;
const DEFAULT_LIMIT = 30;
const STALE_WEBHOOK_MINUTES = 10;
const STALE_QUEUE_MINUTES = 20;
const STALE_PROCESSING_MINUTES = 20;
const STALE_EMAIL_MINUTES = 20;
const MAX_RETRY_ATTEMPTS = 3;

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function minutesSince(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}

function sessionView(row = {}) {
  return {
    id: row.id || null,
    name: row.name || null,
    email: row.email || null,
    lang: row.lang || null,
    stripe_session_id: row.stripe_session_id || null,
    payment_status: row.payment_status || null,
    analysis_status: row.analysis_status || null,
    report_email_status: row.report_email_status || "not_sent",
    report_email_attempts: Number(row.report_email_attempts || 0),
    report_email_error: row.report_email_error || null,
    paid_at: row.paid_at || null,
    checkout_started_at: row.checkout_started_at || null,
    analysis_started_at: row.analysis_started_at || null,
    analysis_completed_at: row.analysis_completed_at || null,
    report_email_sent_at: row.report_email_sent_at || null,
    report_email_last_attempt_at: row.report_email_last_attempt_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function issueView(row = {}) {
  return {
    ...sessionView(row),
    issueType: row.issue_type || "unknown",
    severity: row.severity || "warning",
    detail: row.detail || null,
    ageMinutes: minutesSince(row.reference_at || row.updated_at || row.created_at)
  };
}

function rate(part, total) {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  return denominator > 0 ? numerator / denominator : 0;
}

function stage(key, label, level, count, detail) {
  return {
    key,
    label,
    level,
    count: Number(count || 0),
    detail
  };
}

function levelFromMetrics(metrics) {
  if (
    metrics.failedWebhooks > 0 ||
    metrics.paidFailedSessions > 0 ||
    metrics.staleProcessingJobs > 0 ||
    metrics.retryLimitEmails > 0 ||
    metrics.paidWithoutActiveJob > 0
  ) {
    return "critical";
  }

  if (
    metrics.noProcessedWebhook > 0 ||
    metrics.analysisQueued > 0 ||
    metrics.analysisProcessing > 0 ||
    metrics.failedEmails > 0 ||
    metrics.unsentDoneReports > 0 ||
    metrics.staleSendingEmails > 0
  ) {
    return "warning";
  }

  if (metrics.paidSessions > 0) return "healthy";

  return "active";
}

function recommendations(metrics) {
  const items = [];

  if (metrics.failedWebhooks > 0) {
    items.push("Check Stripe webhook failures first; payment completion can be blocked before the worker sees the session.");
  }

  if (metrics.paidWithoutActiveJob > 0) {
    items.push("Run one analysis job from the dashboard, then inspect paid sessions without active jobs.");
  }

  if (metrics.staleProcessingJobs > 0) {
    items.push("Verify the analysis worker deployment and restart stale processing jobs if needed.");
  }

  if (metrics.failedEmails > 0 || metrics.unsentDoneReports > 0) {
    items.push("Use the email retry batch, then inspect sessions that still remain failed or not_sent.");
  }

  if (metrics.retryLimitEmails > 0) {
    items.push("Retry limit reached for at least one report email; manually inspect the provider error before resetting retry state.");
  }

  if (!items.length) {
    items.push("No immediate post-payment action detected in the selected monitoring window.");
  }

  return items;
}

export async function buildPostPaymentMonitor(options = {}) {
  const hours = clampNumber(options.hours, DEFAULT_WINDOW_HOURS, 1, 24 * 30);
  const limit = clampNumber(options.limit, DEFAULT_LIMIT, 5, 100);

  const params = [
    hours,
    STALE_WEBHOOK_MINUTES,
    STALE_QUEUE_MINUTES,
    STALE_PROCESSING_MINUTES,
    STALE_EMAIL_MINUTES,
    MAX_RETRY_ATTEMPTS,
    limit
  ];
  const summaryParams = params.slice(0, 6);
  const jobParams = params.slice(0, 4);
  const webhookParams = params.slice(0, 2);
  const issueParams = params;

  const [
    summaryResult,
    jobResult,
    webhookResult,
    issueResult
  ] = await Promise.all([
    db.query(
      `
      WITH paid_sessions AS (
        SELECT *
        FROM sessions s
        WHERE s.payment_status = 'paid'
          AND (
            s.paid_at >= NOW() - ($1::int * INTERVAL '1 hour')
            OR s.updated_at >= NOW() - ($1::int * INTERVAL '1 hour')
            OR s.created_at >= NOW() - ($1::int * INTERVAL '1 hour')
          )
      )
      SELECT
        COUNT(*)::int AS paid_sessions,
        COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM webhook_events w
            WHERE w.event_type = 'checkout.session.completed'
              AND w.status = 'processed'
              AND (
                w.payload #>> '{data,object,metadata,internalSessionId}' = paid_sessions.id::text
                OR w.payload #>> '{data,object,id}' = paid_sessions.stripe_session_id
              )
          )
        )::int AS no_processed_webhook,
        COUNT(*) FILTER (WHERE analysis_status = 'queued')::int AS analysis_queued,
        COUNT(*) FILTER (WHERE analysis_status = 'pending')::int AS analysis_pending,
        COUNT(*) FILTER (WHERE analysis_status = 'processing')::int AS analysis_processing,
        COUNT(*) FILTER (WHERE analysis_status = 'failed')::int AS analysis_failed,
        COUNT(*) FILTER (WHERE analysis_status = 'done')::int AS analysis_done,
        COUNT(*) FILTER (
          WHERE analysis_status IN ('pending', 'queued', 'processing')
            AND NOT EXISTS (
              SELECT 1
              FROM analysis_jobs j
              WHERE j.session_id = paid_sessions.id
                AND j.status IN ('queued', 'processing')
            )
        )::int AS paid_without_active_job,
        COUNT(*) FILTER (
          WHERE analysis_status = 'queued'
            AND paid_at < NOW() - ($3::int * INTERVAL '1 minute')
        )::int AS stale_queued_sessions,
        COUNT(*) FILTER (
          WHERE analysis_status = 'processing'
            AND COALESCE(analysis_started_at, updated_at, paid_at) < NOW() - ($4::int * INTERVAL '1 minute')
        )::int AS stale_processing_sessions,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND report_email_status = 'sent'
        )::int AS sent_emails,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND report_email_status = 'failed'
        )::int AS failed_emails,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND report_email_status = 'not_sent'
        )::int AS unsent_done_reports,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND report_email_status = 'sending'
            AND COALESCE(report_email_last_attempt_at, updated_at) < NOW() - ($5::int * INTERVAL '1 minute')
        )::int AS stale_sending_emails,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND report_email_status IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) < $6::int
        )::int AS retryable_emails,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND report_email_status IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) >= $6::int
        )::int AS retry_limit_emails,
        MAX(paid_at) AS last_paid_at,
        MAX(analysis_completed_at) AS last_analysis_completed_at,
        MAX(report_email_sent_at) AS last_email_sent_at
      FROM paid_sessions
      `,
      summaryParams
    ),
    db.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_jobs,
        COUNT(*) FILTER (
          WHERE status = 'queued'
            AND created_at < NOW() - ($3::int * INTERVAL '1 minute')
        )::int AS old_queued_jobs,
        COUNT(*) FILTER (
          WHERE status = 'processing'
            AND locked_at < NOW() - ($4::int * INTERVAL '1 minute')
        )::int AS stale_processing_jobs,
        MAX(processed_at) AS last_processed_at
      FROM analysis_jobs
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 hour')
         OR updated_at >= NOW() - ($1::int * INTERVAL '1 hour')
      `,
      jobParams
    ),
    db.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_webhooks,
        COUNT(*) FILTER (
          WHERE status IN ('received', 'processing')
            AND created_at < NOW() - ($2::int * INTERVAL '1 minute')
        )::int AS stale_webhooks,
        MAX(created_at) AS last_received_at,
        MAX(processed_at) AS last_processed_at
      FROM webhook_events
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 hour')
      `,
      webhookParams
    ),
    db.query(
      `
      WITH paid_sessions AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM webhook_events w
            WHERE w.event_type = 'checkout.session.completed'
              AND w.status = 'processed'
              AND (
                w.payload #>> '{data,object,metadata,internalSessionId}' = s.id::text
                OR w.payload #>> '{data,object,id}' = s.stripe_session_id
              )
          ) AS has_processed_webhook,
          EXISTS (
            SELECT 1
            FROM analysis_jobs j
            WHERE j.session_id = s.id
              AND j.status IN ('queued', 'processing')
          ) AS has_active_job
        FROM sessions s
        WHERE s.payment_status = 'paid'
          AND (
            s.paid_at >= NOW() - ($1::int * INTERVAL '1 hour')
            OR s.updated_at >= NOW() - ($1::int * INTERVAL '1 hour')
            OR s.created_at >= NOW() - ($1::int * INTERVAL '1 hour')
          )
      )
      SELECT
        *,
        CASE
          WHEN NOT has_processed_webhook THEN 'webhook_not_processed'
          WHEN analysis_status = 'failed' THEN 'analysis_failed'
          WHEN analysis_status IN ('pending', 'queued', 'processing') AND NOT has_active_job THEN 'paid_without_active_job'
          WHEN analysis_status = 'queued'
            AND paid_at < NOW() - ($3::int * INTERVAL '1 minute') THEN 'analysis_queue_stale'
          WHEN analysis_status = 'processing'
            AND COALESCE(analysis_started_at, updated_at, paid_at) < NOW() - ($4::int * INTERVAL '1 minute') THEN 'analysis_processing_stale'
          WHEN analysis_status = 'done'
            AND report_email_status = 'failed'
            AND COALESCE(report_email_attempts, 0) >= $6::int THEN 'email_retry_limit'
          WHEN analysis_status = 'done'
            AND report_email_status = 'failed' THEN 'email_failed'
          WHEN analysis_status = 'done'
            AND report_email_status = 'sending'
            AND COALESCE(report_email_last_attempt_at, updated_at) < NOW() - ($5::int * INTERVAL '1 minute') THEN 'email_sending_stale'
          WHEN analysis_status = 'done'
            AND report_email_status = 'not_sent' THEN 'email_not_sent'
          ELSE 'watch'
        END AS issue_type,
        CASE
          WHEN analysis_status = 'failed'
            OR NOT has_processed_webhook
            OR (analysis_status IN ('queued', 'processing') AND NOT has_active_job)
            OR (analysis_status = 'done' AND report_email_status = 'failed' AND COALESCE(report_email_attempts, 0) >= $6::int)
          THEN 'critical'
          ELSE 'warning'
        END AS severity,
        CASE
          WHEN NOT has_processed_webhook THEN 'No processed checkout.session.completed webhook was found for this paid session.'
          WHEN analysis_status = 'failed' THEN COALESCE(error_message, 'Analysis failed.')
          WHEN analysis_status IN ('pending', 'queued', 'processing') AND NOT has_active_job THEN 'Paid session has no active queued or processing analysis job.'
          WHEN analysis_status = 'queued' THEN 'Paid session is still queued after the monitoring threshold.'
          WHEN analysis_status = 'processing' THEN 'Paid session is still processing after the monitoring threshold.'
          WHEN analysis_status = 'done' AND report_email_status = 'failed' THEN COALESCE(report_email_error, 'Report email failed.')
          WHEN analysis_status = 'done' AND report_email_status = 'sending' THEN 'Report email is still in sending state after the threshold.'
          WHEN analysis_status = 'done' AND report_email_status = 'not_sent' THEN 'Report is done but email is not sent.'
          ELSE 'Needs review.'
        END AS detail,
        COALESCE(report_email_last_attempt_at, analysis_started_at, paid_at, updated_at, created_at) AS reference_at
      FROM paid_sessions
      WHERE
        NOT has_processed_webhook
        OR analysis_status = 'failed'
        OR (analysis_status IN ('pending', 'queued', 'processing') AND NOT has_active_job)
        OR (analysis_status = 'queued' AND paid_at < NOW() - ($3::int * INTERVAL '1 minute'))
        OR (analysis_status = 'processing' AND COALESCE(analysis_started_at, updated_at, paid_at) < NOW() - ($4::int * INTERVAL '1 minute'))
        OR (
          analysis_status = 'done'
          AND report_email_status IN ('failed', 'not_sent', 'sending')
        )
      ORDER BY
        CASE
          WHEN NOT has_processed_webhook THEN 1
          WHEN analysis_status = 'failed' THEN 2
          WHEN analysis_status IN ('pending', 'queued', 'processing') AND NOT has_active_job THEN 3
          WHEN analysis_status = 'done' AND report_email_status = 'failed' THEN 4
          ELSE 5
        END,
        reference_at DESC NULLS LAST
      LIMIT $7::int
      `,
      issueParams
    )
  ]);

  const summary = summaryResult.rows[0] || {};
  const jobs = jobResult.rows[0] || {};
  const webhooks = webhookResult.rows[0] || {};

  const metrics = {
    paidSessions: Number(summary.paid_sessions || 0),
    noProcessedWebhook: Number(summary.no_processed_webhook || 0),
    analysisPending: Number(summary.analysis_pending || 0),
    analysisQueued: Number(summary.analysis_queued || 0),
    analysisProcessing: Number(summary.analysis_processing || 0),
    paidFailedSessions: Number(summary.analysis_failed || 0),
    analysisDone: Number(summary.analysis_done || 0),
    paidWithoutActiveJob: Number(summary.paid_without_active_job || 0),
    staleQueuedSessions: Number(summary.stale_queued_sessions || 0),
    staleProcessingSessions: Number(summary.stale_processing_sessions || 0),
    failedJobs: Number(jobs.failed_jobs || 0),
    oldQueuedJobs: Number(jobs.old_queued_jobs || 0),
    staleProcessingJobs: Number(jobs.stale_processing_jobs || 0),
    failedWebhooks: Number(webhooks.failed_webhooks || 0),
    staleWebhooks: Number(webhooks.stale_webhooks || 0),
    sentEmails: Number(summary.sent_emails || 0),
    failedEmails: Number(summary.failed_emails || 0),
    unsentDoneReports: Number(summary.unsent_done_reports || 0),
    staleSendingEmails: Number(summary.stale_sending_emails || 0),
    retryableEmails: Number(summary.retryable_emails || 0),
    retryLimitEmails: Number(summary.retry_limit_emails || 0)
  };

  metrics.completionRate = rate(metrics.analysisDone, metrics.paidSessions);
  metrics.emailSentRate = rate(metrics.sentEmails, metrics.analysisDone);
  metrics.issueCount =
    metrics.noProcessedWebhook +
    metrics.failedWebhooks +
    metrics.staleWebhooks +
    metrics.analysisPending +
    metrics.analysisQueued +
    metrics.analysisProcessing +
    metrics.paidFailedSessions +
    metrics.paidWithoutActiveJob +
    metrics.staleQueuedSessions +
    metrics.staleProcessingSessions +
    metrics.staleProcessingJobs +
    metrics.failedEmails +
    metrics.unsentDoneReports +
    metrics.staleSendingEmails +
    metrics.retryLimitEmails;

  const level = levelFromMetrics(metrics);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    level,
    window: {
      hours,
      staleWebhookMinutes: STALE_WEBHOOK_MINUTES,
      staleQueueMinutes: STALE_QUEUE_MINUTES,
      staleProcessingMinutes: STALE_PROCESSING_MINUTES,
      staleEmailMinutes: STALE_EMAIL_MINUTES,
      maxRetryAttempts: MAX_RETRY_ATTEMPTS
    },
    metrics,
    timestamps: {
      lastPaidAt: summary.last_paid_at || null,
      lastAnalysisCompletedAt: summary.last_analysis_completed_at || null,
      lastEmailSentAt: summary.last_email_sent_at || null,
      lastJobProcessedAt: jobs.last_processed_at || null,
      lastWebhookReceivedAt: webhooks.last_received_at || null,
      lastWebhookProcessedAt: webhooks.last_processed_at || null,
      lastPaidMinutesAgo: minutesSince(summary.last_paid_at),
      lastAnalysisCompletedMinutesAgo: minutesSince(summary.last_analysis_completed_at),
      lastEmailSentMinutesAgo: minutesSince(summary.last_email_sent_at),
      lastJobProcessedMinutesAgo: minutesSince(jobs.last_processed_at),
      lastWebhookProcessedMinutesAgo: minutesSince(webhooks.last_processed_at)
    },
    stages: [
      stage(
        "webhook",
        "Stripe webhook",
        metrics.failedWebhooks || metrics.staleWebhooks || metrics.noProcessedWebhook ? "critical" : "healthy",
        metrics.noProcessedWebhook,
        `${metrics.failedWebhooks} failed webhook, ${metrics.staleWebhooks} stale received/processing event`
      ),
      stage(
        "analysis",
        "Analysis worker",
        metrics.paidFailedSessions || metrics.staleProcessingJobs || metrics.paidWithoutActiveJob ? "critical" : metrics.analysisPending || metrics.analysisQueued || metrics.analysisProcessing ? "warning" : "healthy",
        metrics.analysisPending + metrics.analysisQueued + metrics.analysisProcessing + metrics.paidFailedSessions,
        `${metrics.analysisDone} done, ${metrics.analysisPending} pending, ${metrics.failedJobs} failed job, ${metrics.paidWithoutActiveJob} paid without active job`
      ),
      stage(
        "email",
        "Report email",
        metrics.retryLimitEmails ? "critical" : metrics.failedEmails || metrics.unsentDoneReports || metrics.staleSendingEmails ? "warning" : "healthy",
        metrics.failedEmails + metrics.unsentDoneReports + metrics.staleSendingEmails,
        `${metrics.sentEmails} sent, ${metrics.retryableEmails} retryable, ${metrics.retryLimitEmails} retry limit`
      )
    ],
    issues: issueResult.rows.map(issueView),
    recommendations: recommendations(metrics)
  };
}
