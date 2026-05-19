import { db } from "../../db/db.js";
import {
  getSessionById,
  markAnalysisQueued
} from "../../services/session.service.js";
import { processNextAnalysisJob } from "../../services/analysis-job.service.js";
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