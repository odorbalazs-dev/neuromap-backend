import { db } from "../../db/db.js";
import {
  getSessionById,
  markAnalysisQueued,
  resetReportEmailRetry
} from "../../services/session.service.js";
import { processNextAnalysisJob } from "../../services/analysis-job.service.js";
import { enqueueAnalysisJob } from "../../services/analysis-queue.service.js";
import { deliverReportEmailForSession } from "../../services/report-email-delivery.service.js";
import { retryReportEmailsBatch } from "../../services/report-email-retry.service.js";
import {
  getRecentAdminAlerts,
  runProductionHealthAlertCheck
} from "../../services/admin-alert.service.js";
import { env } from "../../config/env.js";

function shortText(value = "", max = 600) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function buildSessionView(sessionRow) {
  return {
    id: sessionRow.id,
    email: sessionRow.email,
    name: sessionRow.name,
    lang: sessionRow.lang,

    payment_status: sessionRow.payment_status,
    analysis_status: sessionRow.analysis_status,
    report_email_status: sessionRow.report_email_status || "not_sent",
    report_email_sent_at: sessionRow.report_email_sent_at,
    report_email_last_attempt_at: sessionRow.report_email_last_attempt_at,
    report_email_error: sessionRow.report_email_error,
    report_email_provider_id: sessionRow.report_email_provider_id,
    report_email_attempts: sessionRow.report_email_attempts || 0,

    stripe_session_id: sessionRow.stripe_session_id,
    paid_at: sessionRow.paid_at,
    analysis_started_at: sessionRow.analysis_started_at,
    analysis_completed_at: sessionRow.analysis_completed_at,
    error_message: sessionRow.error_message,

    detectedRisk: sessionRow.payload?.detectedRisk || null,
    secondaryRisk: sessionRow.payload?.secondaryRisk || null,
    questionnaireVersion: sessionRow.payload?.questionnaireVersion || null,

    counts: {
      triageQuestions: sessionRow.payload?.triageQuestions?.length || 0,
      triageAnswers: sessionRow.payload?.triageAnswers?.length || 0,
      specificQuestions: sessionRow.payload?.specificQuestions?.length || 0,
      specificAnswers: sessionRow.payload?.specificAnswers?.length || 0,
      extraQuestions: sessionRow.payload?.extraQuestions?.length || 0,
      extraAnswers: sessionRow.payload?.extraAnswers?.length || 0
    },

    hasPayload: Boolean(sessionRow.payload),
    hasAnalysisResult: Boolean(sessionRow.analysis_result),
    analysisResultLength: sessionRow.analysis_result
      ? String(sessionRow.analysis_result).length
      : 0,
    analysisPreview: shortText(sessionRow.analysis_result, 800),

    created_at: sessionRow.created_at,
    updated_at: sessionRow.updated_at
  };
}

function buildCompactSessionView(row) {
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
    report_email_attempts: row.report_email_attempts || 0,

    detectedRisk: row.payload?.detectedRisk || null,
    secondaryRisk: row.payload?.secondaryRisk || null,

    paid_at: row.paid_at,
    analysis_started_at: row.analysis_started_at,
    analysis_completed_at: row.analysis_completed_at,
    error_message: row.error_message,

    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    Math.max(number, min),
    max
  );
}

function eventSeverityClass(value) {
  const status = String(value || "").toLowerCase();

  if (["failed", "critical", "error"].includes(status)) return "critical";
  if (["warning", "not_sent", "sending"].includes(status)) return "warning";
  if (["queued", "processing", "active"].includes(status)) return "active";
  return "info";
}

function buildOperationEvent({
  kind,
  severity,
  title,
  status,
  detail,
  sessionId = null,
  email = null,
  name = null,
  createdAt = null
}) {
  return {
    kind,
    severity: severity || eventSeverityClass(status),
    title,
    status: status || null,
    detail: shortText(detail || "", 240),
    sessionId,
    email,
    name,
    createdAt
  };
}

export async function getAdminStatus(_req, res) {
  return res.status(200).json({
    ok: true,
    service: "neuromap-admin",
    nodeEnv: env.NODE_ENV,
    adminTokenConfigured: Boolean(env.ADMIN_TOKEN),
    cronSecretConfigured: Boolean(env.CRON_SECRET),
    openaiConfigured: Boolean(env.OPENAI_API_KEY),
    resendConfigured: Boolean(env.RESEND_API_KEY),
    stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
    metaConfigured: Boolean(env.META_PIXEL_ID && env.META_ACCESS_TOKEN),
    adminAlertEmailConfigured: Boolean(env.ADMIN_ALERT_EMAIL)
  });
}

export async function getQueueStatus(_req, res) {
  try {
    const result = await db.query(`
      SELECT
        analysis_status,
        COUNT(*)::int AS count
      FROM sessions
      WHERE payment_status = 'paid'
      GROUP BY analysis_status
      ORDER BY analysis_status ASC
    `);

    const recentQueued = await db.query(`
      SELECT *
      FROM sessions
      WHERE payment_status = 'paid'
        AND analysis_status IN ('queued', 'processing', 'failed')
      ORDER BY
        CASE analysis_status
          WHEN 'failed' THEN 1
          WHEN 'processing' THEN 2
          WHEN 'queued' THEN 3
          ELSE 4
        END,
        paid_at ASC NULLS LAST,
        created_at ASC
      LIMIT 20
    `);

    return res.status(200).json({
      ok: true,
      counts: result.rows.reduce((acc, row) => {
        acc[row.analysis_status] = row.count;
        return acc;
      }, {}),
      items: recentQueued.rows.map(buildCompactSessionView)
    });
  } catch (error) {
    console.error("Admin queue status error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get queue status"
    });
  }
}

function minutesSince(value) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;

  return Math.max(0, Math.round((Date.now() - timestamp) / 60000));
}

function healthLevel({
  staleProcessingJobs = 0,
  failedJobs = 0,
  failedWebhooks24h = 0,
  paidFailedSessions = 0,
  paidQueuedSessions = 0,
  paidProcessingSessions = 0,
  failedReportEmails = 0,
  unsentDoneReports = 0,
  retryLimitReportEmails = 0
}) {
  if (
    staleProcessingJobs > 0 ||
    failedWebhooks24h > 0 ||
    failedReportEmails > 0 ||
    retryLimitReportEmails > 0
  ) {
    return "critical";
  }

  if (failedJobs > 0 || paidFailedSessions > 0 || unsentDoneReports > 0) {
    return "warning";
  }

  if (paidQueuedSessions > 0 || paidProcessingSessions > 0) {
    return "active";
  }

  return "healthy";
}

function buildRecommendations({
  staleProcessingJobs,
  failedJobs,
  failedWebhooks24h,
  paidFailedSessions,
  paidQueuedSessions,
  paidProcessingSessions,
  failedReportEmails,
  unsentDoneReports,
  retryLimitReportEmails
}) {
  const recommendations = [];

  if (staleProcessingJobs > 0) {
    recommendations.push(
      "Van beragadt processing job. Ellenőrizd a worker logot, majd retry vagy process-one-job javasolt."
    );
  }

  if (failedWebhooks24h > 0) {
    recommendations.push(
      "Az elmúlt 24 órában volt hibás webhook. Nézd meg a Stripe webhook secretet és az érintett sessiont."
    );
  }

  if (failedJobs > 0 || paidFailedSessions > 0) {
    recommendations.push(
      "Van failed analysis. A dashboardon sessionenként retry indítható."
    );
  }

  if (failedReportEmails > 0) {
    recommendations.push(
      "Van sikertelen riport email. A dashboardon sessionenként Email újraküldés indítható."
    );
  }

  if (unsentDoneReports > 0) {
    recommendations.push(
      "Van elkészült riport, amelynél nincs elküldött email státusz. Ellenőrizd a session részleteit, majd küldd újra az emailt."
    );
  }

  if (retryLimitReportEmails > 0) {
    recommendations.push(
      "Van riport email, amely elérte az automatikus retry limitet. Ezeket manuálisan kell ellenőrizni a dashboardon."
    );
  }

  if (paidQueuedSessions > 0) {
    recommendations.push(
      "Van fizetett queued session. Ha nem fogy a queue, ellenőrizd, hogy a worker service npm run worker módban fut-e."
    );
  }

  if (paidProcessingSessions > 0) {
    recommendations.push(
      "Van processing session. Ez normális lehet, ha friss fizetés történt; hosszú ideig tartó processing esetén worker log ellenőrzés kell."
    );
  }

  if (!recommendations.length) {
    recommendations.push("A kritikus fizetés → webhook → worker lánc jelenleg tisztának látszik.");
  }

  return recommendations;
}

export async function getProductionHealth(_req, res) {
  try {
    const [
      dbTime,
      sessionCounts,
      jobCounts,
      jobTiming,
      staleJobs,
      webhookCounts,
      webhookTiming,
      recentWebhookFailures,
      paidSessionsWithoutActiveJob,
      doneWithoutResult,
      reportEmailCounts,
      reportEmailTiming,
      reportEmailIssues
    ] = await Promise.all([
      db.query("SELECT NOW() AS now"),
      db.query(`
        SELECT
          payment_status,
          analysis_status,
          COUNT(*)::int AS count
        FROM sessions
        GROUP BY payment_status, analysis_status
      `),
      db.query(`
        SELECT
          status,
          COUNT(*)::int AS count
        FROM analysis_jobs
        GROUP BY status
      `),
      db.query(`
        SELECT
          MAX(processed_at) AS last_processed_at,
          MAX(updated_at) AS last_updated_at,
          MIN(created_at) FILTER (WHERE status = 'queued') AS oldest_queued_at,
          MIN(locked_at) FILTER (WHERE status = 'processing') AS oldest_processing_at
        FROM analysis_jobs
      `),
      db.query(`
        SELECT
          id,
          session_id,
          status,
          attempts,
          locked_at,
          locked_by,
          last_error,
          created_at,
          updated_at
        FROM analysis_jobs
        WHERE status = 'processing'
          AND locked_at < NOW() - INTERVAL '15 minutes'
        ORDER BY locked_at ASC
        LIMIT 10
      `),
      db.query(`
        SELECT
          status,
          COUNT(*)::int AS count
        FROM webhook_events
        GROUP BY status
      `),
      db.query(`
        SELECT
          MAX(created_at) AS last_received_at,
          MAX(processed_at) AS last_processed_at,
          COUNT(*) FILTER (
            WHERE status = 'failed'
              AND created_at >= NOW() - INTERVAL '24 hours'
          )::int AS failed_last_24h,
          COUNT(*) FILTER (
            WHERE status IN ('received', 'processing')
          )::int AS pending_or_processing
        FROM webhook_events
      `),
      db.query(`
        SELECT
          event_id,
          event_type,
          status,
          error_message,
          created_at,
          processed_at
        FROM webhook_events
        WHERE status = 'failed'
        ORDER BY created_at DESC
        LIMIT 10
      `),
      db.query(`
        SELECT
          s.id,
          s.email,
          s.name,
          s.lang,
          s.analysis_status,
          s.paid_at,
          s.updated_at
        FROM sessions s
        WHERE s.payment_status = 'paid'
          AND s.analysis_status IN ('queued', 'processing')
          AND NOT EXISTS (
            SELECT 1
            FROM analysis_jobs j
            WHERE j.session_id = s.id
              AND j.status IN ('queued', 'processing')
          )
        ORDER BY s.paid_at ASC NULLS LAST, s.created_at ASC
        LIMIT 20
      `),
      db.query(`
        SELECT
          id,
          email,
          name,
          lang,
          analysis_status,
          paid_at,
          updated_at
        FROM sessions
        WHERE payment_status = 'paid'
          AND analysis_status = 'done'
          AND (
            analysis_result IS NULL
            OR LENGTH(TRIM(analysis_result)) = 0
          )
        ORDER BY updated_at DESC
        LIMIT 20
      `),
      db.query(`
        SELECT
          report_email_status,
          COUNT(*)::int AS count
        FROM sessions
        WHERE payment_status = 'paid'
          AND analysis_status = 'done'
        GROUP BY report_email_status
      `),
      db.query(`
        SELECT
          MAX(report_email_sent_at) AS last_sent_at,
          MAX(report_email_last_attempt_at) AS last_attempt_at,
          COUNT(*) FILTER (
            WHERE report_email_status = 'failed'
          )::int AS failed_count,
          COUNT(*) FILTER (
            WHERE analysis_status = 'done'
              AND analysis_result IS NOT NULL
              AND LENGTH(TRIM(analysis_result)) > 0
              AND report_email_status IN ('not_sent', 'sending')
          )::int AS unsent_done_count,
          COUNT(*) FILTER (
            WHERE analysis_status = 'done'
              AND analysis_result IS NOT NULL
              AND LENGTH(TRIM(analysis_result)) > 0
              AND report_email_status IN ('failed', 'not_sent', 'sending')
              AND COALESCE(report_email_attempts, 0) < 3
          )::int AS retryable_count,
          COUNT(*) FILTER (
            WHERE analysis_status = 'done'
              AND analysis_result IS NOT NULL
              AND LENGTH(TRIM(analysis_result)) > 0
              AND report_email_status IN ('failed', 'not_sent', 'sending')
              AND COALESCE(report_email_attempts, 0) >= 3
          )::int AS retry_limit_count
        FROM sessions
        WHERE payment_status = 'paid'
      `),
      db.query(`
        SELECT
          id,
          email,
          name,
          lang,
          analysis_status,
          report_email_status,
          report_email_sent_at,
          report_email_last_attempt_at,
          report_email_error,
          report_email_attempts,
          paid_at,
          updated_at
        FROM sessions
        WHERE payment_status = 'paid'
          AND analysis_status = 'done'
          AND report_email_status IN ('failed', 'not_sent', 'sending')
        ORDER BY
          CASE report_email_status
            WHEN 'failed' THEN 1
            WHEN 'sending' THEN 2
            WHEN 'not_sent' THEN 3
            ELSE 4
          END,
          report_email_last_attempt_at DESC NULLS LAST,
          updated_at DESC
        LIMIT 20
      `)
    ]);

    const sessions = {};
    for (const row of sessionCounts.rows) {
      const paymentStatus = row.payment_status || "unknown";
      const analysisStatus = row.analysis_status || "unknown";
      sessions[paymentStatus] = sessions[paymentStatus] || {};
      sessions[paymentStatus][analysisStatus] = row.count;
    }

    const jobs = jobCounts.rows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    const webhooks = webhookCounts.rows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    const reportEmails = reportEmailCounts.rows.reduce((acc, row) => {
      acc[row.report_email_status || "not_sent"] = row.count;
      return acc;
    }, {});

    const jobTimingRow = jobTiming.rows[0] || {};
    const webhookTimingRow = webhookTiming.rows[0] || {};
    const reportEmailTimingRow = reportEmailTiming.rows[0] || {};

    const metrics = {
      staleProcessingJobs: staleJobs.rows.length,
      failedJobs: Number(jobs.failed || 0),
      failedWebhooks24h: Number(webhookTimingRow.failed_last_24h || 0),
      paidFailedSessions: Number(sessions.paid?.failed || 0),
      paidQueuedSessions: Number(sessions.paid?.queued || 0),
      paidProcessingSessions: Number(sessions.paid?.processing || 0),
      failedReportEmails: Number(reportEmailTimingRow.failed_count || 0),
      unsentDoneReports: Number(reportEmailTimingRow.unsent_done_count || 0),
      retryLimitReportEmails: Number(reportEmailTimingRow.retry_limit_count || 0)
    };

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      databaseTime: dbTime.rows[0]?.now || null,
      level: healthLevel(metrics),
      metrics,
      sessions: {
        counts: sessions,
        paidWithoutActiveJob: paidSessionsWithoutActiveJob.rows.map(buildCompactSessionView),
        doneWithoutAnalysisResult: doneWithoutResult.rows.map(buildCompactSessionView)
      },
      jobs: {
        counts: jobs,
        lastProcessedAt: jobTimingRow.last_processed_at || null,
        lastProcessedMinutesAgo: minutesSince(jobTimingRow.last_processed_at),
        lastUpdatedAt: jobTimingRow.last_updated_at || null,
        oldestQueuedAt: jobTimingRow.oldest_queued_at || null,
        oldestQueuedMinutes: minutesSince(jobTimingRow.oldest_queued_at),
        oldestProcessingAt: jobTimingRow.oldest_processing_at || null,
        oldestProcessingMinutes: minutesSince(jobTimingRow.oldest_processing_at),
        staleProcessing: staleJobs.rows
      },
      webhooks: {
        counts: webhooks,
        failedLast24h: Number(webhookTimingRow.failed_last_24h || 0),
        pendingOrProcessing: Number(webhookTimingRow.pending_or_processing || 0),
        lastReceivedAt: webhookTimingRow.last_received_at || null,
        lastReceivedMinutesAgo: minutesSince(webhookTimingRow.last_received_at),
        lastProcessedAt: webhookTimingRow.last_processed_at || null,
        lastProcessedMinutesAgo: minutesSince(webhookTimingRow.last_processed_at),
        recentFailures: recentWebhookFailures.rows
      },
      email: {
        persistentDeliveryTracking: true,
        counts: reportEmails,
        failedCount: Number(reportEmailTimingRow.failed_count || 0),
        unsentDoneCount: Number(reportEmailTimingRow.unsent_done_count || 0),
        retryableCount: Number(reportEmailTimingRow.retryable_count || 0),
        retryLimitCount: Number(reportEmailTimingRow.retry_limit_count || 0),
        lastSentAt: reportEmailTimingRow.last_sent_at || null,
        lastSentMinutesAgo: minutesSince(reportEmailTimingRow.last_sent_at),
        lastAttemptAt: reportEmailTimingRow.last_attempt_at || null,
        lastAttemptMinutesAgo: minutesSince(reportEmailTimingRow.last_attempt_at),
        issues: reportEmailIssues.rows.map(buildCompactSessionView)
      },
      recommendations: buildRecommendations(metrics)
    });
  } catch (error) {
    console.error("Admin production health error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get production health"
    });
  }
}

export async function getOperationsLog(req, res) {
  try {
    const limit = clampNumber(req.query.limit, 80, 10, 200);
    const filter = String(req.query.filter || "all").toLowerCase();
    const allowedFilters = new Set([
      "all",
      "email",
      "analysis",
      "webhook",
      "checkout",
      "critical"
    ]);

    const normalizedFilter = allowedFilters.has(filter) ? filter : "all";

    const [
      recentSessions,
      recentJobs,
      recentWebhooks
    ] = await Promise.all([
      db.query(
        `
        SELECT
          id,
          email,
          name,
          payment_status,
          analysis_status,
          report_email_status,
          report_email_error,
          report_email_attempts,
          paid_at,
          analysis_started_at,
          analysis_completed_at,
          report_email_sent_at,
          report_email_last_attempt_at,
          checkout_started_at,
          checkout_cancelled_at,
          created_at,
          updated_at
        FROM sessions
        ORDER BY updated_at DESC NULLS LAST, created_at DESC
        LIMIT $1
        `,
        [Math.max(limit, 100)]
      ),
      db.query(
        `
        SELECT
          j.id,
          j.session_id,
          j.status,
          j.attempts,
          j.locked_at,
          j.locked_by,
          j.last_error,
          j.created_at,
          j.updated_at,
          j.processed_at,
          s.email,
          s.name
        FROM analysis_jobs j
        LEFT JOIN sessions s ON s.id = j.session_id
        ORDER BY j.updated_at DESC NULLS LAST, j.created_at DESC
        LIMIT $1
        `,
        [Math.max(limit, 100)]
      ),
      db.query(
        `
        SELECT
          event_id,
          event_type,
          status,
          error_message,
          created_at,
          processed_at
        FROM webhook_events
        ORDER BY created_at DESC
        LIMIT $1
        `,
        [Math.max(limit, 100)]
      )
    ]);

    const events = [];

    for (const row of recentSessions.rows) {
      if (row.report_email_status || row.report_email_last_attempt_at || row.report_email_sent_at) {
        events.push(
          buildOperationEvent({
            kind: "email",
            status: row.report_email_status || "not_sent",
            title: "Report email",
            detail: row.report_email_error ||
              `${Number(row.report_email_attempts || 0)} attempts`,
            sessionId: row.id,
            email: row.email,
            name: row.name,
            createdAt: row.report_email_last_attempt_at ||
              row.report_email_sent_at ||
              row.updated_at
          })
        );
      }

      if (row.analysis_status) {
        events.push(
          buildOperationEvent({
            kind: "analysis",
            status: row.analysis_status,
            title: "Analysis session",
            detail: `payment=${row.payment_status}`,
            sessionId: row.id,
            email: row.email,
            name: row.name,
            createdAt: row.analysis_completed_at ||
              row.analysis_started_at ||
              row.updated_at
          })
        );
      }

      if (row.payment_status === "paid" || row.checkout_started_at || row.checkout_cancelled_at) {
        events.push(
          buildOperationEvent({
            kind: "checkout",
            status: row.payment_status,
            title: row.checkout_cancelled_at && row.payment_status !== "paid"
              ? "Checkout cancelled"
              : "Checkout/session",
            detail: row.checkout_cancelled_at && row.payment_status !== "paid"
              ? "Cancelled before payment"
              : `payment=${row.payment_status}`,
            sessionId: row.id,
            email: row.email,
            name: row.name,
            createdAt: row.paid_at ||
              row.checkout_cancelled_at ||
              row.checkout_started_at ||
              row.created_at
          })
        );
      }
    }

    for (const row of recentJobs.rows) {
      events.push(
        buildOperationEvent({
          kind: "analysis",
          status: row.status,
          title: "Analysis job",
          detail: row.last_error ||
            `attempts=${Number(row.attempts || 0)} lockedBy=${row.locked_by || "-"}`,
          sessionId: row.session_id,
          email: row.email,
          name: row.name,
          createdAt: row.processed_at ||
            row.updated_at ||
            row.created_at
        })
      );
    }

    for (const row of recentWebhooks.rows) {
      events.push(
        buildOperationEvent({
          kind: "webhook",
          status: row.status,
          title: row.event_type || "Webhook event",
          detail: row.error_message || row.event_id,
          createdAt: row.processed_at || row.created_at
        })
      );
    }

    const filtered = events
      .filter((event) => {
        if (normalizedFilter === "all") return true;
        if (normalizedFilter === "critical") return event.severity === "critical";
        return event.kind === normalizedFilter;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);

    return res.status(200).json({
      ok: true,
      filter: normalizedFilter,
      count: filtered.length,
      items: filtered
    });
  } catch (error) {
    console.error("Admin operations log error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get operations log"
    });
  }
}

export async function getAdminAlerts(req, res) {
  try {
    const limit = clampNumber(req.query.limit, 10, 1, 100);
    const items = await getRecentAdminAlerts({ limit });

    return res.status(200).json({
      ok: true,
      items
    });
  } catch (error) {
    console.error("Admin alerts error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get admin alerts"
    });
  }
}

export async function triggerAdminAlertCheck(req, res) {
  try {
    const cooldownMinutes = clampNumber(
      req.query.cooldownMinutes ?? req.body?.cooldownMinutes,
      30,
      1,
      1440
    );

    const force =
      String(req.query.force ?? req.body?.force ?? "false").toLowerCase() === "true";

    const result =
      await runProductionHealthAlertCheck({
        cooldownMinutes,
        force
      });

    return res.status(result.ok === false ? 500 : 200).json(result);
  } catch (error) {
    console.error("Admin alert check error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to run admin alert check"
    });
  }
}

export async function getRecentSessions(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 100);

    const result = await db.query(
      `
      SELECT *
      FROM sessions
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return res.status(200).json({
      ok: true,
      items: result.rows.map(buildCompactSessionView)
    });
  } catch (error) {
    console.error("Admin recent sessions error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get recent sessions"
    });
  }
}

export async function getFailedAnalyses(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 100);

    const result = await db.query(
      `
      SELECT *
      FROM sessions
      WHERE analysis_status = 'failed'
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return res.status(200).json({
      ok: true,
      items: result.rows.map(buildCompactSessionView)
    });
  } catch (error) {
    console.error("Admin failed analyses error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get failed analyses"
    });
  }
}

export async function getAdminSession(req, res) {
  try {
    const { sessionId } = req.params;

    const sessionRow = await getSessionById(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    return res.status(200).json({
      ok: true,
      session: buildSessionView(sessionRow)
    });
  } catch (error) {
    console.error("Admin session error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get session"
    });
  }
}

export async function retryAnalysis(req, res) {
  const { sessionId } = req.params;

  try {
    const sessionRow = await getSessionById(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    if (sessionRow.payment_status !== "paid") {
      return res.status(400).json({
        ok: false,
        error: "Cannot retry analysis for unpaid session"
      });
    }

    if (!sessionRow.payload) {
      return res.status(400).json({
        ok: false,
        error: "Session has no payload"
      });
    }

    await markAnalysisQueued(sessionId);
    await enqueueAnalysisJob(sessionId);

    return res.status(200).json({
      ok: true,
      sessionId,
      analysisStatus: "queued"
    });
  } catch (error) {
    console.error("Admin retry analysis error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to retry analysis"
    });
  }
}

export async function processOneAnalysisJob(_req, res) {
  try {
    const result = await processNextAnalysisJob();

    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error("Admin process one analysis job error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to process analysis job"
    });
  }
}

export async function resendReportEmail(req, res) {
  try {
    const { sessionId } = req.params;

    const sessionRow = await getSessionById(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    if (!sessionRow.analysis_result) {
      return res.status(400).json({
        ok: false,
        error: "No analysis result found for this session"
      });
    }

    const result = await deliverReportEmailForSession(
      sessionRow,
      {
        source: "admin",
        throwOnFailure: true
      }
    );

    return res.status(200).json({
      ok: true,
      sessionId,
      emailSent: true,
      providerId: result.providerId || null
    });
  } catch (error) {
    console.error("Admin resend email error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to resend report email"
    });
  }
}

export async function retryReportEmailBatch(req, res) {
  try {
    const result =
      await retryReportEmailsBatch(
        {
          ...(req.query || {}),
          ...(req.body || {})
        },
        { source: "admin-report-email-retry" }
      );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin report email batch retry error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to retry report emails"
    });
  }
}

export async function resetReportEmailRetryForSession(req, res) {
  try {
    const { sessionId } = req.params;

    const sessionRow =
      await resetReportEmailRetry(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Retryable report email session not found"
      });
    }

    return res.status(200).json({
      ok: true,
      sessionId,
      reportEmailStatus: sessionRow.report_email_status,
      reportEmailAttempts: sessionRow.report_email_attempts
    });
  } catch (error) {
    console.error("Admin reset report email retry error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to reset report email retry"
    });
  }
}
