import { db } from "../../db/db.js";
import {
  getSessionById,
  markAnalysisQueued
} from "../../services/session.service.js";
import { processNextAnalysisJob } from "../../services/analysis-job.service.js";
import { enqueueAnalysisJob } from "../../services/analysis-queue.service.js";
import { sendReportEmail } from "../../services/email.service.js";
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
    metaConfigured: Boolean(env.META_PIXEL_ID && env.META_ACCESS_TOKEN)
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
  paidProcessingSessions = 0
}) {
  if (staleProcessingJobs > 0 || failedWebhooks24h > 0) {
    return "critical";
  }

  if (failedJobs > 0 || paidFailedSessions > 0) {
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
  paidProcessingSessions
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

  recommendations.push(
    "Email delivery pontos monitorozásához később érdemes külön email_sent_at/email_error mezőket rögzíteni."
  );

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
      doneWithoutResult
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

    const jobTimingRow = jobTiming.rows[0] || {};
    const webhookTimingRow = webhookTiming.rows[0] || {};

    const metrics = {
      staleProcessingJobs: staleJobs.rows.length,
      failedJobs: Number(jobs.failed || 0),
      failedWebhooks24h: Number(webhookTimingRow.failed_last_24h || 0),
      paidFailedSessions: Number(sessions.paid?.failed || 0),
      paidQueuedSessions: Number(sessions.paid?.queued || 0),
      paidProcessingSessions: Number(sessions.paid?.processing || 0)
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
        persistentDeliveryTracking: false,
        note: "A riport email küldése jelenleg a worker folyamat része, de külön email_sent_at/email_error mező még nincs tárolva."
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

    await sendReportEmail({
      to: sessionRow.email,
      lang: sessionRow.lang,
      name: sessionRow.name,
      reportText: sessionRow.analysis_result,
      payload: sessionRow.payload
    });

    return res.status(200).json({
      ok: true,
      sessionId,
      emailSent: true
    });
  } catch (error) {
    console.error("Admin resend email error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to resend report email"
    });
  }
}
