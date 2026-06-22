import fs from "fs";
import path from "path";
import { db } from "../../db/db.js";
import {
  getSessionById,
  markAnalysisQueued,
  resetReportEmailRetry
} from "../../services/session.service.js";
import { processNextAnalysisJob } from "../../services/analysis-job.service.js";
import {
  enqueueAnalysisJob,
  getAnalysisQueueSnapshot
} from "../../services/analysis-queue.service.js";
import { deliverReportEmailForSession } from "../../services/report-email-delivery.service.js";
import { retryReportEmailsBatch } from "../../services/report-email-retry.service.js";
import { generatePdfBuffer } from "../../services/pdf.service.js";
import {
  buildOperationalAlertSnapshot,
  runBankQualityAlertCheck,
  getRecentAdminAlerts,
  runOperationalAlertCheck,
  runProductionHealthAlertCheck
} from "../../services/admin-alert.service.js";
import { buildAdminSessionReportSummary } from "../../services/admin-session-summary.service.js";
import { buildEngineLiveDecisionAudit } from "../../services/engine-live-audit.service.js";
import { buildBankQualityAudit } from "../../services/bank-quality-audit.service.js";
import { buildEmailDeliverabilityMonitor } from "../../services/email-deliverability.service.js";
import { buildPostPaymentMonitor } from "../../services/post-payment-monitoring.service.js";
import { runPostPaymentRecoveryV2 } from "../../services/post-payment-recovery.service.js";
import { buildWebflowEmbedManager } from "../../services/webflow-embed-manager.service.js";
import { buildDashboardMetrics } from "../../services/dashboard-metrics.service.js";
import { buildCampaignCapacitySnapshot } from "../../services/campaign-capacity.service.js";
import { getFollowUpEmailStatus, processDueFollowUpEmails } from "../../services/follow-up-email.service.js";
import { buildI18nQualityAudit } from "../../services/i18n-quality-audit.service.js";
import { env } from "../../config/env.js";
import {
  createInvoiceForSessionId,
  getRecentInvoices
} from "../../services/invoice.service.js";
import {
  invoiceConfig,
  isInvoiceAutomationConfigured
} from "../../config/invoice.js";

function shortText(value = "", max = 600) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function buildDiagnosticStage(key, label, level, status, detail) {
  return {
    key,
    label,
    level,
    status,
    detail
  };
}

function normalizeAnalysisJob(row = {}) {
  return {
    id: row.id || null,
    session_id: row.session_id || null,
    status: row.status || null,
    attempts: Number(row.attempts || 0),
    locked_at: row.locked_at || null,
    locked_by: row.locked_by || null,
    last_error: row.last_error || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    next_attempt_at: row.next_attempt_at || null,
    failed_at: row.failed_at || null,
    processed_at: row.processed_at || null
  };
}

function normalizeWebhookEvent(row = {}) {
  return {
    event_id: row.event_id || null,
    event_type: row.event_type || null,
    status: row.status || null,
    error_message: row.error_message || null,
    stripe_session_id: row.stripe_session_id || null,
    internal_session_id: row.internal_session_id || null,
    created_at: row.created_at || null,
    processed_at: row.processed_at || null
  };
}

function buildSessionDiagnostics(sessionRow, analysisJobRows = [], webhookEventRows = []) {
  const paymentStatus = sessionRow.payment_status || "unknown";
  const analysisStatus = sessionRow.analysis_status || "unknown";
  const emailStatus = sessionRow.report_email_status || "not_sent";
  const hasPayload = Boolean(sessionRow.payload);
  const hasResult = Boolean(sessionRow.analysis_result);
  const latestJob = analysisJobRows[0] || null;
  const completedWebhook = webhookEventRows.find(
    (row) => row.event_type === "checkout.session.completed"
  );
  const failedWebhook = webhookEventRows.find((row) => row.status === "failed");

  const stages = [];
  const actions = [];

  if (paymentStatus === "paid") {
    stages.push(buildDiagnosticStage(
      "payment",
      "Fizetés",
      "ok",
      paymentStatus,
      "A session fizetett állapotban van."
    ));
  } else if (paymentStatus === "failed") {
    stages.push(buildDiagnosticStage(
      "payment",
      "Fizetés",
      "problem",
      paymentStatus,
      "A fizetési folyamat hibás státuszt kapott."
    ));
    actions.push("Ellenőrizd a Stripe sessiont, majd szükség esetén küldd újra a checkout linket.");
  } else {
    stages.push(buildDiagnosticStage(
      "payment",
      "Fizetés",
      "waiting",
      paymentStatus,
      "A fizetés még nincs visszaigazolva."
    ));
  }

  if (completedWebhook?.status === "processed") {
    stages.push(buildDiagnosticStage(
      "webhook",
      "Stripe webhook",
      "ok",
      completedWebhook.status,
      "A checkout.session.completed webhook feldolgozva."
    ));
  } else if (failedWebhook) {
    stages.push(buildDiagnosticStage(
      "webhook",
      "Stripe webhook",
      "problem",
      failedWebhook.status,
      failedWebhook.error_message || "Webhook feldolgozási hiba rögzítve."
    ));
    actions.push("Nézd meg a webhook hibát, majd a Stripe eseményt szükség esetén küldd újra.");
  } else if (webhookEventRows.length) {
    stages.push(buildDiagnosticStage(
      "webhook",
      "Stripe webhook",
      "waiting",
      webhookEventRows[0].status,
      "Kapcsolódó webhook esemény látszik, de nincs feldolgozott checkout completion."
    ));
  } else if (paymentStatus === "paid") {
    stages.push(buildDiagnosticStage(
      "webhook",
      "Stripe webhook",
      "unknown",
      "nincs találat",
      "A session fizetett, de ehhez nem találtam kapcsolódó webhook sort."
    ));
    actions.push("Ha a fizetés rendben van, de nincs webhook sor, ellenőrizd a Stripe webhook endpointot és a STRIPE_WEBHOOK_SECRET értéket.");
  } else {
    stages.push(buildDiagnosticStage(
      "webhook",
      "Stripe webhook",
      "waiting",
      "fizetésre vár",
      "Webhook csak sikeres checkout után várható."
    ));
  }

  if (analysisStatus === "done") {
    stages.push(buildDiagnosticStage(
      "analysis",
      "Elemzés",
      "ok",
      analysisStatus,
      "Az elemzés kész állapotban van."
    ));
  } else if (analysisStatus === "failed") {
    stages.push(buildDiagnosticStage(
      "analysis",
      "Elemzés",
      "problem",
      analysisStatus,
      sessionRow.error_message || latestJob?.last_error || "Az elemzés hibára futott."
    ));
    actions.push("Indítsd újra az elemzést az admin panelből, majd figyeld a worker job státuszát.");
  } else if (["queued", "processing", "pending"].includes(analysisStatus)) {
    const hasActiveJob = analysisJobRows.some((row) => ["queued", "processing"].includes(row.status));
    stages.push(buildDiagnosticStage(
      "analysis",
      "Elemzés",
      hasActiveJob || paymentStatus !== "paid" ? "waiting" : "problem",
      latestJob?.status || analysisStatus,
      hasActiveJob
        ? "Van aktív worker job az elemzéshez."
        : paymentStatus === "paid"
          ? "Fizetett session, de nem látszik aktív worker job."
          : "Az elemzés a fizetés visszaigazolására vár."
    ));

    if (paymentStatus === "paid" && !hasActiveJob && hasPayload) {
      actions.push("Hozz létre vagy indíts újra analysis jobot az admin panelből.");
    }
  } else {
    stages.push(buildDiagnosticStage(
      "analysis",
      "Elemzés",
      "unknown",
      analysisStatus,
      "Ismeretlen elemzési státusz."
    ));
  }

  if (hasResult) {
    stages.push(buildDiagnosticStage(
      "pdf",
      "PDF alapanyag",
      "ok",
      "riport elérhető",
      "Az elemzési szöveg elérhető, a PDF újragenerálható."
    ));
  } else if (analysisStatus === "done") {
    stages.push(buildDiagnosticStage(
      "pdf",
      "PDF alapanyag",
      "problem",
      "hiányzik",
      "Az elemzés kész, de nincs mentett riportszöveg."
    ));
    actions.push("Regeneráld az elemzést, mert a PDF alapjául szolgáló szöveg hiányzik.");
  } else {
    stages.push(buildDiagnosticStage(
      "pdf",
      "PDF alapanyag",
      "waiting",
      "elemzésre vár",
      "A PDF csak elkészült elemzés után állítható elő."
    ));
  }

  if (emailStatus === "sent") {
    stages.push(buildDiagnosticStage(
      "email",
      "Riport email",
      "ok",
      emailStatus,
      "A riport email elküldve."
    ));
  } else if (emailStatus === "failed") {
    stages.push(buildDiagnosticStage(
      "email",
      "Riport email",
      "problem",
      emailStatus,
      sessionRow.report_email_error || "Email kézbesítési hiba."
    ));
    actions.push("Ellenőrizd a kézbesítési hibát, majd használd az email újraküldés vagy retry alaphelyzet gombot.");
  } else if (hasResult) {
    stages.push(buildDiagnosticStage(
      "email",
      "Riport email",
      "waiting",
      emailStatus,
      "A riport elérhető, az email még nincs sikeresen elküldve."
    ));
    actions.push("Küldd újra a riport emailt az admin panelből.");
  } else {
    stages.push(buildDiagnosticStage(
      "email",
      "Riport email",
      "waiting",
      emailStatus,
      "Email küldés az elemzés elkészülése után várható."
    ));
  }

  const overallLevel = stages.some((stage) => stage.level === "problem")
    ? "critical"
    : stages.some((stage) => stage.level === "waiting" || stage.level === "unknown")
      ? "warning"
      : "healthy";

  if (!actions.length) {
    actions.push("Nincs sürgős teendő. A session folyamatának fő pontjai rendben vannak.");
  }

  return {
    overallLevel,
    stages,
    recommendedActions: [...new Set(actions)]
  };
}

function escapeLikePattern(value = "") {
  return String(value || "").replace(/[\\%_]/g, "\\$&");
}

function safeFilenamePart(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildReportPdfFilename(sessionRow) {
  const name =
    safeFilenamePart(sessionRow?.name) ||
    safeFilenamePart(sessionRow?.email) ||
    safeFilenamePart(sessionRow?.id) ||
    "session";

  const lang = safeFilenamePart(sessionRow?.lang) || "en";

  return `neuromap-kids-report-${lang}-${name}.pdf`;
}

async function generateReportPdfForSession(sessionRow) {
  const reportText = String(sessionRow?.analysis_result || "").trim();

  if (!reportText) {
    const error = new Error("No analysis result found for this session");
    error.statusCode = 400;
    throw error;
  }

  const pdfBuffer = await generatePdfBuffer({
    name: sessionRow.name,
    reportText,
    lang: sessionRow.lang || "en",
    payload: sessionRow.payload
  });

  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    const error = new Error("PDF generation returned an empty buffer");
    error.statusCode = 500;
    throw error;
  }

  return pdfBuffer;
}

function buildSessionView(sessionRow, analysisJobRows = [], webhookEventRows = []) {
  const latestAnalysisJob = analysisJobRows[0] || null;

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
    reportSummary: buildAdminSessionReportSummary(sessionRow, latestAnalysisJob),
    diagnostics: buildSessionDiagnostics(sessionRow, analysisJobRows, webhookEventRows),
    analysisJobs: analysisJobRows.map(normalizeAnalysisJob),
    webhookEvents: webhookEventRows.map(normalizeWebhookEvent),

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
    stripe_session_id: row.stripe_session_id,

    detectedRisk: row.payload?.detectedRisk || null,
    secondaryRisk: row.payload?.secondaryRisk || null,
    questionnaireVersion: row.payload?.questionnaireVersion || null,
    reportSummary: buildAdminSessionReportSummary(row),

    paid_at: row.paid_at,
    analysis_started_at: row.analysis_started_at,
    analysis_completed_at: row.analysis_completed_at,
    error_message: row.error_message,
    hasPayload: Boolean(row.payload),
    hasAnalysisResult: Boolean(row.analysis_result),
    analysisResultLength: row.analysis_result
      ? String(row.analysis_result).length
      : 0,

    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function incrementCount(target, key) {
  const normalizedKey = key || "unknown";
  target[normalizedKey] = Number(target[normalizedKey] || 0) + 1;
}

function addNumberMetric(target, key, value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return;
  }

  if (!target[key]) {
    target[key] = {
      sum: 0,
      count: 0
    };
  }

  target[key].sum += number;
  target[key].count += 1;
}

function averageMetric(target, key) {
  const metric = target[key] || {};
  return metric.count ? metric.sum / metric.count : null;
}

function sortedCountEntries(counts = {}, limit = 20) {
  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      count: Number(count || 0)
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

function hasEngineAnalyticsInput(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (Array.isArray(payload.triageRanking) && payload.triageRanking.length > 0) {
    return true;
  }

  const triageScores = payload.triageScores || {};
  return Object.values(triageScores).some((value) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0;
  });
}

function buildEngineAnalyticsReviewSession(row, engine) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    lang: row.lang,
    payment_status: row.payment_status,
    analysis_status: row.analysis_status,
    primaryDomain: engine.primaryDomain || null,
    secondaryDomain: engine.secondaryDomain || null,
    confidence: Number.isFinite(Number(engine.confidence))
      ? Number(engine.confidence)
      : null,
    confidenceLabel: engine.confidenceLabel || null,
    scoreGap: Number.isFinite(Number(engine.scoreGap))
      ? Number(engine.scoreGap)
      : null,
    overlapScore: Number.isFinite(Number(engine.overlapScore))
      ? Number(engine.overlapScore)
      : null,
    patternType: engine.patternType || null,
    decisionQuality: engine.decisionQuality || null,
    shouldAskExtra: Boolean(engine.shouldAskExtra),
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
    const [result, recentQueued, queueSnapshot] = await Promise.all([
      db.query(`
        SELECT
          analysis_status,
          COUNT(*)::int AS count
        FROM sessions
        WHERE payment_status = 'paid'
        GROUP BY analysis_status
        ORDER BY analysis_status ASC
      `),
      db.query(`
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
      `),
      getAnalysisQueueSnapshot()
    ]);

    return res.status(200).json({
      ok: true,
      counts: result.rows.reduce((acc, row) => {
        acc[row.analysis_status] = row.count;
        return acc;
      }, {}),
      jobs: queueSnapshot,
      capacity: buildCampaignCapacitySnapshot({
        queueSnapshot,
        workerConcurrency: env.WORKER_CONCURRENCY,
        expectedJobSeconds: env.WORKER_EXPECTED_JOB_SECONDS,
        targetReportsPerDay: env.CAMPAIGN_TARGET_REPORTS_PER_DAY
      }),
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

function readinessCheck({
  id,
  group,
  label,
  status,
  detail,
  action = null,
  meta = {}
}) {
  return {
    id,
    group,
    label,
    status,
    detail,
    action,
    meta
  };
}

function summarizeReadiness(checks) {
  const summary = checks.reduce(
    (acc, check) => {
      acc.total += 1;
      if (check.status === "pass") acc.passed += 1;
      if (check.status === "warn") acc.warnings += 1;
      if (check.status === "fail") acc.failed += 1;
      return acc;
    },
    { total: 0, passed: 0, warnings: 0, failed: 0 }
  );

  const level = summary.failed > 0
    ? "blocked"
    : summary.warnings > 0
      ? "warning"
      : "ready";

  return { level, summary };
}

function safeJsonFile(relativePath) {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
    );
  } catch (_error) {
    return null;
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

async function buildLaunchReadinessChecks() {
  const checks = [];

  const requiredEnv = [
    ["DATABASE_URL", env.DATABASE_URL],
    ["OPENAI_API_KEY", env.OPENAI_API_KEY],
    ["STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY],
    ["STRIPE_WEBHOOK_SECRET", env.STRIPE_WEBHOOK_SECRET],
    ["RESEND_API_KEY", env.RESEND_API_KEY],
    ["EMAIL_FROM", env.EMAIL_FROM],
    ["SUCCESS_URL", env.SUCCESS_URL],
    ["CANCEL_URL", env.CANCEL_URL],
    ["APP_URL", env.APP_URL],
    ["APP_BASE_URL", env.APP_BASE_URL],
    ["ADMIN_TOKEN", env.ADMIN_TOKEN],
    ["CRON_SECRET", env.CRON_SECRET]
  ];

  const missingRequiredEnv = requiredEnv
    .filter(([, value]) => !value)
    .map(([name]) => name);

  checks.push(readinessCheck({
    id: "required-env",
    group: "Konfiguracio",
    label: "Kotelezo env valtozok",
    status: missingRequiredEnv.length ? "fail" : "pass",
    detail: missingRequiredEnv.length
      ? `Hianyzik: ${missingRequiredEnv.join(", ")}.`
      : "A backend inditasahoz es a fizetes-riport folyamathoz szukseges env valtozok elerhetok.",
    action: missingRequiredEnv.length
      ? "Railway Variables alatt potold a hianyzo ertekeket, majd deploy."
      : null,
    meta: {
      checked: requiredEnv.map(([name, value]) => ({
        name,
        configured: Boolean(value)
      }))
    }
  }));

  checks.push(readinessCheck({
    id: "optional-marketing-env",
    group: "Konfiguracio",
    label: "Marketing es riasztasi env",
    status: env.META_PIXEL_ID && env.META_ACCESS_TOKEN && env.ADMIN_ALERT_EMAIL
      ? "pass"
      : "warn",
    detail: env.META_PIXEL_ID && env.META_ACCESS_TOKEN && env.ADMIN_ALERT_EMAIL
      ? "Meta Conversions API es admin riasztasi email is konfiguralva."
      : "A core termek mukodhet, de a Meta CAPI vagy az admin riasztasi email nincs teljesen konfiguralva.",
    action: "Eles hirdetesek elott ellenorizd: META_PIXEL_ID, META_ACCESS_TOKEN, ADMIN_ALERT_EMAIL.",
    meta: {
      metaConfigured: Boolean(env.META_PIXEL_ID && env.META_ACCESS_TOKEN),
      adminAlertEmailConfigured: Boolean(env.ADMIN_ALERT_EMAIL)
    }
  }));

  if (env.DATABASE_ERROR) {
    checks.push(readinessCheck({
      id: "database-config",
      group: "Adatbazis",
      label: "Database konfiguracio",
      status: "fail",
      detail: env.DATABASE_ERROR,
      action: "Allits be ervenyes DATABASE_URL-t vagy teljes PG* valtozokat Railway-ben."
    }));
  } else {
    try {
      await db.query("SELECT NOW() AS now");
      checks.push(readinessCheck({
        id: "database-connection",
        group: "Adatbazis",
        label: "Database kapcsolat",
        status: "pass",
        detail: "A backend eleri a Postgres adatbazist."
      }));
    } catch (error) {
      checks.push(readinessCheck({
        id: "database-connection",
        group: "Adatbazis",
        label: "Database kapcsolat",
        status: "fail",
        detail: error.message || "Nem sikerult kapcsolodni a Postgres adatbazishoz.",
        action: "Ellenorizd a Railway Postgres service-t es a DATABASE_URL erteket."
      }));
    }
  }

  try {
    const expectedColumns = {
      sessions: [
        "id",
        "payload",
        "payment_status",
        "analysis_status",
        "analysis_result",
        "stripe_session_id",
        "report_email_status",
        "report_email_attempts",
        "checkout_started_at",
        "checkout_cancelled_at",
        "recovery_token"
      ],
      analysis_jobs: [
        "id",
        "session_id",
        "status",
        "attempts",
        "locked_at",
        "last_error"
      ],
      webhook_events: [
        "id",
        "event_id",
        "event_type",
        "status",
        "error_message"
      ],
      admin_alerts: [
        "id",
        "alert_key",
        "level",
        "status",
        "summary",
        "sent_to"
      ]
    };

    const tableNames = Object.keys(expectedColumns);
    const schemaResult = await db.query(
      `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      `,
      [tableNames]
    );

    const available = schemaResult.rows.reduce((acc, row) => {
      acc[row.table_name] = acc[row.table_name] || new Set();
      acc[row.table_name].add(row.column_name);
      return acc;
    }, {});

    const missing = [];
    for (const [table, columns] of Object.entries(expectedColumns)) {
      if (!available[table]) {
        missing.push(`${table} tabla`);
        continue;
      }

      for (const column of columns) {
        if (!available[table].has(column)) {
          missing.push(`${table}.${column}`);
        }
      }
    }

    checks.push(readinessCheck({
      id: "database-schema",
      group: "Adatbazis",
      label: "Migraciok es tablak",
      status: missing.length ? "fail" : "pass",
      detail: missing.length
        ? `Hianyzo schema elemek: ${missing.join(", ")}.`
        : "A kritikus sessions, analysis_jobs, webhook_events es admin_alerts schema elemek megvannak.",
      action: missing.length
        ? "Futtasd ujra a deployt/migraciokat, majd ellenorizd a Railway logot."
        : null
    }));
  } catch (error) {
    checks.push(readinessCheck({
      id: "database-schema",
      group: "Adatbazis",
      label: "Migraciok es tablak",
      status: "fail",
      detail: error.message || "Nem sikerult ellenorizni a schema allapotot.",
      action: "Ellenorizd a migracio logokat es az adatbazis jogosultsagokat."
    }));
  }

  try {
    const health = await Promise.all([
      db.query(`
        SELECT COUNT(*)::int AS count
        FROM analysis_jobs
        WHERE status = 'processing'
          AND locked_at < NOW() - INTERVAL '15 minutes'
      `),
      db.query(`
        SELECT COUNT(*)::int AS count
        FROM webhook_events
        WHERE status = 'failed'
          AND created_at >= NOW() - INTERVAL '24 hours'
      `),
      db.query(`
        SELECT COUNT(*)::int AS count
        FROM sessions
        WHERE payment_status = 'paid'
          AND analysis_status = 'done'
          AND report_email_status IN ('failed', 'not_sent', 'sending')
          AND COALESCE(report_email_attempts, 0) >= 3
      `)
    ]);

    const staleProcessingJobs = Number(health[0].rows[0]?.count || 0);
    const failedWebhooks24h = Number(health[1].rows[0]?.count || 0);
    const retryLimitEmails = Number(health[2].rows[0]?.count || 0);
    const blockingCount = staleProcessingJobs + failedWebhooks24h + retryLimitEmails;

    checks.push(readinessCheck({
      id: "critical-production-state",
      group: "Eles mukodes",
      label: "Kritikus folyamatallapot",
      status: blockingCount ? "fail" : "pass",
      detail: blockingCount
        ? `${staleProcessingJobs} beragadt worker job, ${failedWebhooks24h} webhook hiba 24 oraban, ${retryLimitEmails} email retry limit.`
        : "Nincs ismert kritikus beragadt worker, friss webhook hiba vagy email retry limit.",
      action: blockingCount
        ? "Hasznald a dashboard retry/process/alert gombjait, majd ellenorizd ujra."
        : null,
      meta: {
        staleProcessingJobs,
        failedWebhooks24h,
        retryLimitEmails
      }
    }));
  } catch (error) {
    checks.push(readinessCheck({
      id: "critical-production-state",
      group: "Eles mukodes",
      label: "Kritikus folyamatallapot",
      status: "warn",
      detail: error.message || "Nem sikerult lekerdezni a kritikus folyamatallapotot.",
      action: "Ha az adatbazis elerheto, probald ujra a launch readiness frissitest."
    }));
  }

  const requiredAssets = [
    "public/banks/all-banks.bundle.js",
    "public/banks/triage.embed.js",
    "public/admin-dashboard.js",
    "public/admin-dashboard.css"
  ];

  const missingAssets = requiredAssets.filter((asset) => !fileExists(asset));

  checks.push(readinessCheck({
    id: "runtime-assets",
    group: "Frontend assetek",
    label: "Bank bundle es admin assetek",
    status: missingAssets.length ? "fail" : "pass",
    detail: missingAssets.length
      ? `Hianyzo fajlok: ${missingAssets.join(", ")}.`
      : "A runtime bank bundle, triage embed es admin dashboard assetek elerhetok a repo-ban.",
    action: missingAssets.length
      ? "Futtasd ujra a bank buildet vagy ellenorizd a public mappat deploy elott."
      : null
  }));

  const packageJson = safeJsonFile("package.json");
  const scripts = packageJson?.scripts || {};
  const missingScripts = ["start", "worker", "audit:all"].filter((name) => !scripts[name]);

  checks.push(readinessCheck({
    id: "runtime-scripts",
    group: "Deploy",
    label: "Backend es worker scriptek",
    status: missingScripts.length ? "fail" : "pass",
    detail: missingScripts.length
      ? `Hianyzo npm scriptek: ${missingScripts.join(", ")}.`
      : "Megvan a start, worker es audit:all script.",
    action: missingScripts.length
      ? "Allitsd vissza a package.json deployment scripteket."
      : null,
    meta: {
      start: scripts.start || null,
      worker: scripts.worker || null,
      auditAll: scripts["audit:all"] || null
    }
  }));

  const railwayToml = fileExists("railway.toml")
    ? fs.readFileSync(path.join(process.cwd(), "railway.toml"), "utf8")
    : "";

  checks.push(readinessCheck({
    id: "railway-worker-command",
    group: "Deploy",
    label: "Worker start command",
    status: railwayToml.includes('startCommand = "npm start"') ? "warn" : "pass",
    detail: railwayToml.includes('startCommand = "npm start"')
      ? "A repo railway.toml alapertelmezett startCommand erteke npm start. Ez jo a web service-nek, de a worker service-ben Railway override kell: npm run worker."
      : "A railway.toml nem kenyszeriti npm start parancsra a worker service-t.",
    action: "Railway worker service Settings alatt ellenorizd: Start Command = npm run worker."
  }));

  return checks;
}

function buildLaunchManualChecks() {
  return [
    {
      label: "Webflow publish",
      detail: "A Home, checkout success es checkout cancel oldalak legyenek publisholva, es ugyanarra a backend API_BASE_URL-re mutassanak."
    },
    {
      label: "Stripe webhook",
      detail: "Stripe Dashboardban a production webhook endpoint legyen aktiv, es a STRIPE_WEBHOOK_SECRET egyezzen Railway-ben."
    },
    {
      label: "Stripe mode",
      detail: "Eles inditas elott dontsd el, hogy test vagy live fizetesi mod megy ki, es ehhez illeszkedjen a STRIPE_SECRET_KEY."
    },
    {
      label: "GTM / Meta esemenyek",
      detail: "Tag Assistant es Meta Events Manager alatt ellenorizd legalabb a landing, checkout start es purchase esemenyeket."
    },
    {
      label: "Valos probavasarlas",
      detail: "Inditas elott egy teljes vegigfutas: kitoltes -> checkout -> success -> worker -> PDF -> email."
    }
  ];
}

export async function getLaunchReadiness(_req, res) {
  try {
    const checks = await buildLaunchReadinessChecks();
    const { level, summary } = summarizeReadiness(checks);

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      level,
      summary,
      checks,
      manualChecks: buildLaunchManualChecks()
    });
  } catch (error) {
    console.error("Admin launch readiness error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get launch readiness"
    });
  }
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

export async function getDashboardMetrics(_req, res) {
  try {
    const metrics = await buildDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error("[admin] dashboard metrics failed:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "Dashboard metrics failed"
    });
  }
}

export async function getEmailDeliverability(req, res) {
  try {
    const monitor = await buildEmailDeliverabilityMonitor({
      hours: req.query.hours,
      limit: req.query.limit
    });

    return res.status(200).json(monitor);
  } catch (error) {
    console.error("Admin email deliverability error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get email deliverability monitor"
    });
  }
}

function normalizeEmailDeliveryCenterRow(row = {}) {
  const compact = buildCompactSessionView(row);

  return {
    ...compact,
    report_email_provider_id: row.report_email_provider_id || null,
    paidMinutesAgo: minutesSince(row.paid_at),
    lastAttemptMinutesAgo: minutesSince(row.report_email_last_attempt_at),
    sentMinutesAgo: minutesSince(row.report_email_sent_at),
    updatedMinutesAgo: minutesSince(row.updated_at || row.created_at)
  };
}

function buildEmailDeliveryPriority(row = {}) {
  const status = row.report_email_status || "not_sent";
  const attempts = Number(row.report_email_attempts || 0);

  if (attempts >= 3 && ["failed", "not_sent", "sending"].includes(status)) {
    return "retry_limit";
  }

  if (status === "failed") return "failed";
  if (status === "sending") return "sending";
  if (status === "not_sent") return "not_sent";
  if (status === "sent") return "sent";

  return "other";
}

export async function getEmailDeliveryCenter(req, res) {
  try {
    const limit = Math.floor(clampNumber(req.query.limit, 60, 10, 150));
    const status = String(req.query.status || "all").toLowerCase();
    const allowedStatuses = new Set([
      "all",
      "failed",
      "not_sent",
      "sending",
      "sent",
      "retry_limit",
      "actionable"
    ]);

    const normalizedStatus = allowedStatuses.has(status) ? status : "all";

    const summaryResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(report_email_status, 'not_sent') = 'sent')::int AS sent_count,
        COUNT(*) FILTER (WHERE COALESCE(report_email_status, 'not_sent') = 'failed')::int AS failed_count,
        COUNT(*) FILTER (WHERE COALESCE(report_email_status, 'not_sent') = 'sending')::int AS sending_count,
        COUNT(*) FILTER (WHERE COALESCE(report_email_status, 'not_sent') = 'not_sent')::int AS not_sent_count,
        COUNT(*) FILTER (
          WHERE COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) < 3
        )::int AS retryable_count,
        COUNT(*) FILTER (
          WHERE COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) >= 3
        )::int AS retry_limit_count,
        MAX(report_email_sent_at) AS last_sent_at,
        MAX(report_email_last_attempt_at) AS last_attempt_at
      FROM sessions
      WHERE analysis_status = 'done'
         OR report_email_status IS NOT NULL
         OR report_email_last_attempt_at IS NOT NULL
         OR report_email_sent_at IS NOT NULL
    `);

    const rowsResult = await db.query(
      `
      SELECT *
      FROM sessions
      WHERE (
          analysis_status = 'done'
          OR report_email_status IS NOT NULL
          OR report_email_last_attempt_at IS NOT NULL
          OR report_email_sent_at IS NOT NULL
        )
        AND (
          $1::text = 'all'
          OR ($1::text = 'actionable' AND COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending'))
          OR ($1::text = 'retry_limit' AND COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending') AND COALESCE(report_email_attempts, 0) >= 3)
          OR ($1::text NOT IN ('all', 'actionable', 'retry_limit') AND COALESCE(report_email_status, 'not_sent') = $1::text)
        )
      ORDER BY
        CASE
          WHEN COALESCE(report_email_status, 'not_sent') IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) >= 3 THEN 1
          WHEN COALESCE(report_email_status, 'not_sent') = 'failed' THEN 2
          WHEN COALESCE(report_email_status, 'not_sent') = 'sending' THEN 3
          WHEN COALESCE(report_email_status, 'not_sent') = 'not_sent' THEN 4
          ELSE 5
        END,
        report_email_last_attempt_at DESC NULLS LAST,
        report_email_sent_at DESC NULLS LAST,
        updated_at DESC NULLS LAST,
        created_at DESC
      LIMIT $2::int
      `,
      [normalizedStatus, limit]
    );

    const summary = summaryResult.rows[0] || {};
    const items = rowsResult.rows.map((row) => ({
      ...normalizeEmailDeliveryCenterRow(row),
      deliveryPriority: buildEmailDeliveryPriority(row)
    }));

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      filter: normalizedStatus,
      limit,
      summary: {
        sent: Number(summary.sent_count || 0),
        failed: Number(summary.failed_count || 0),
        sending: Number(summary.sending_count || 0),
        notSent: Number(summary.not_sent_count || 0),
        retryable: Number(summary.retryable_count || 0),
        retryLimit: Number(summary.retry_limit_count || 0),
        lastSentAt: summary.last_sent_at || null,
        lastSentMinutesAgo: minutesSince(summary.last_sent_at),
        lastAttemptAt: summary.last_attempt_at || null,
        lastAttemptMinutesAgo: minutesSince(summary.last_attempt_at)
      },
      items
    });
  } catch (error) {
    console.error("Admin email delivery center error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get email delivery center"
    });
  }
}

export async function getPostPaymentMonitoring(req, res) {
  try {
    const monitor = await buildPostPaymentMonitor({
      hours: req.query.hours,
      limit: req.query.limit
    });

    return res.status(200).json(monitor);
  } catch (error) {
    console.error("Admin post-payment monitoring error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get post-payment monitor"
    });
  }
}

export async function triggerPostPaymentRecovery(req, res) {
  try {
    const result = await runPostPaymentRecoveryV2({
      ...(req.query || {}),
      ...(req.body || {})
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin post-payment recovery error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to run post-payment recovery"
    });
  }
}

export async function getFollowUpEmails(req, res) {
  try {
    const limit = Math.floor(clampNumber(req.query.limit, 20, 1, 100));
    const status = await getFollowUpEmailStatus({ limit });

    return res.status(200).json({
      ok: true,
      ...status
    });
  } catch (error) {
    console.error("Admin follow-up email status error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get follow-up email status"
    });
  }
}

export async function runFollowUpEmails(req, res) {
  try {
    const limit = Math.floor(clampNumber(req.query.limit || req.body?.limit, 10, 1, 50));
    const result = await processDueFollowUpEmails({ limit });

    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error("Admin follow-up email run error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to run follow-up emails"
    });
  }
}

export async function getWebflowEmbedManager(_req, res) {
  try {
    const manager = await buildWebflowEmbedManager();

    return res.status(200).json(manager);
  } catch (error) {
    console.error("Admin Webflow embed manager error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get Webflow embed manager"
    });
  }
}

export async function getI18nQualityAudit(_req, res) {
  try {
    return res.status(200).json(buildI18nQualityAudit());
  } catch (error) {
    console.error("Admin i18n quality audit error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get i18n quality audit"
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
        LIMIT $1::int
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
        LIMIT $1::int
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
        LIMIT $1::int
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
    const [items, operational] = await Promise.all([
      getRecentAdminAlerts({ limit }),
      buildOperationalAlertSnapshot({
        windowHours: clampNumber(req.query.windowHours, 24, 1, 720),
        limit: 30
      })
    ]);

    return res.status(200).json({
      ok: true,
      operational,
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

export async function triggerOperationalAlertCheck(req, res) {
  try {
    const cooldownMinutes = clampNumber(
      req.query.cooldownMinutes ?? req.body?.cooldownMinutes,
      30,
      1,
      1440
    );

    const windowHours = clampNumber(
      req.query.windowHours ?? req.body?.windowHours,
      24,
      1,
      720
    );

    const force =
      String(req.query.force ?? req.body?.force ?? "false").toLowerCase() === "true";

    const minLevel = String(
      req.query.minLevel ?? req.body?.minLevel ?? "warning"
    ).toLowerCase();

    const result =
      await runOperationalAlertCheck({
        cooldownMinutes,
        force,
        minLevel,
        windowHours
      });

    return res.status(result.ok === false ? 500 : 200).json(result);
  } catch (error) {
    console.error("Admin operational alert check error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to run operational alert check"
    });
  }
}

export async function triggerBankQualityAlertCheck(req, res) {
  try {
    const cooldownMinutes = clampNumber(
      req.query.cooldownMinutes ?? req.body?.cooldownMinutes,
      30,
      1,
      1440
    );

    const force =
      String(req.query.force ?? req.body?.force ?? "false").toLowerCase() === "true";

    const strict =
      String(req.query.strict ?? req.body?.strict ?? "false").toLowerCase() === "true";

    const minLevel = String(
      req.query.minLevel ?? req.body?.minLevel ?? "review"
    ).toLowerCase();

    const result =
      await runBankQualityAlertCheck({
        cooldownMinutes,
        force,
        strict,
        minLevel
      });

    return res.status(result.ok === false ? 500 : 200).json(result);
  } catch (error) {
    console.error("Admin bank quality alert check error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to run bank quality alert check"
    });
  }
}

export async function getEngineAnalytics(req, res) {
  try {
    const limit = clampNumber(req.query.limit, 300, 20, 1000);

    const result = await db.query(
      `
      SELECT
        id,
        email,
        name,
        lang,
        payment_status,
        analysis_status,
        report_email_status,
        report_email_attempts,
        report_email_error,
        analysis_result,
        payload,
        created_at,
        updated_at,
        paid_at
      FROM sessions
      WHERE payload IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $1::int
      `,
      [limit]
    );

    const domainCounts = {};
    const secondaryCounts = {};
    const severityCounts = {};
    const decisionQualityCounts = {};
    const patternTypeCounts = {};
    const confidenceLabelCounts = {};
    const focusAreaCounts = {};
    const overlapPairStats = {};
    const numericMetrics = {};
    const reviewQueue = [];

    let sessionsWithEngine = 0;
    let extraQuestionSessions = 0;

    for (const row of result.rows) {
      if (!hasEngineAnalyticsInput(row.payload)) {
        continue;
      }

      const summary = buildAdminSessionReportSummary(row);
      const engine = summary.engine || {};

      if (!engine || engine.error || !engine.primaryDomain) {
        continue;
      }

      sessionsWithEngine += 1;

      incrementCount(domainCounts, engine.primaryDomain);
      incrementCount(secondaryCounts, engine.secondaryDomain || "none");
      incrementCount(severityCounts, engine.severity || summary.severity || "unknown");
      incrementCount(decisionQualityCounts, engine.decisionQuality || "unknown");
      incrementCount(patternTypeCounts, engine.patternType || "unknown");
      incrementCount(confidenceLabelCounts, engine.confidenceLabel || "unknown");

      addNumberMetric(numericMetrics, "confidence", engine.confidence);
      addNumberMetric(numericMetrics, "scoreGap", engine.scoreGap);
      addNumberMetric(numericMetrics, "overlapScore", engine.overlapScore);

      if (engine.shouldAskExtra) {
        extraQuestionSessions += 1;
      }

      if (engine.primaryDomain && engine.secondaryDomain) {
        const key = `${engine.primaryDomain}-${engine.secondaryDomain}`;
        if (!overlapPairStats[key]) {
          overlapPairStats[key] = {
            pair: key,
            primaryDomain: engine.primaryDomain,
            secondaryDomain: engine.secondaryDomain,
            count: 0,
            overlapSum: 0,
            confidenceSum: 0
          };
        }

        overlapPairStats[key].count += 1;
        overlapPairStats[key].overlapSum += Number(engine.overlapScore || 0);
        overlapPairStats[key].confidenceSum += Number(engine.confidence || 0);
      }

      if (Array.isArray(engine.recommendedFocusAreas)) {
        engine.recommendedFocusAreas.forEach((area) => {
          incrementCount(focusAreaCounts, area);
        });
      }

      const needsReview =
        engine.decisionQuality === "low" ||
        engine.confidenceLabel === "low" ||
        engine.shouldAskExtra ||
        Number(engine.overlapScore || 0) >= 0.65;

      if (needsReview && reviewQueue.length < 25) {
        reviewQueue.push(buildEngineAnalyticsReviewSession(row, engine));
      }
    }

    const overlapPairs = Object.values(overlapPairStats)
      .map((item) => ({
        pair: item.pair,
        primaryDomain: item.primaryDomain,
        secondaryDomain: item.secondaryDomain,
        count: item.count,
        averageOverlap: item.count ? item.overlapSum / item.count : null,
        averageConfidence: item.count ? item.confidenceSum / item.count : null
      }))
      .sort((a, b) => b.count - a.count || b.averageOverlap - a.averageOverlap)
      .slice(0, 12);

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      window: {
        requestedLimit: limit,
        loadedSessions: result.rows.length,
        sessionsWithEngine
      },
      metrics: {
        totalSessions: result.rows.length,
        sessionsWithEngine,
        extraQuestionSessions,
        extraQuestionRate: sessionsWithEngine
          ? extraQuestionSessions / sessionsWithEngine
          : 0,
        averageConfidence: averageMetric(numericMetrics, "confidence"),
        averageScoreGap: averageMetric(numericMetrics, "scoreGap"),
        averageOverlapScore: averageMetric(numericMetrics, "overlapScore")
      },
      distributions: {
        primaryDomains: sortedCountEntries(domainCounts),
        secondaryDomains: sortedCountEntries(secondaryCounts),
        severities: sortedCountEntries(severityCounts),
        decisionQuality: sortedCountEntries(decisionQualityCounts),
        patternTypes: sortedCountEntries(patternTypeCounts),
        confidenceLabels: sortedCountEntries(confidenceLabelCounts)
      },
      overlapPairs,
      focusAreas: sortedCountEntries(focusAreaCounts, 20),
      reviewQueue
    });
  } catch (error) {
    console.error("Admin engine analytics error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get engine analytics"
    });
  }
}

export async function getEngineDecisionAudit(req, res) {
  try {
    const limit = clampNumber(req.query.limit, 300, 20, 1000);

    const result = await db.query(
      `
      SELECT
        id,
        lang,
        payment_status,
        analysis_status,
        report_email_status,
        payload,
        created_at,
        updated_at,
        paid_at
      FROM sessions
      WHERE payload IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $1::int
      `,
      [limit]
    );

    const audit = buildEngineLiveDecisionAudit(result.rows);

    return res.status(200).json({
      ...audit,
      window: {
        requestedLimit: limit,
        loadedSessions: result.rows.length
      }
    });
  } catch (error) {
    console.error("Admin engine decision audit error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to run engine decision audit"
    });
  }
}

export async function getBankQualityAudit(req, res) {
  try {
    const audit = await buildBankQualityAudit({
      strict: req.query.strict === "true",
      includePublic: req.query.public !== "false"
    });

    return res.status(200).json(audit);
  } catch (error) {
    console.error("Admin bank quality audit error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to run bank quality audit"
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
      LIMIT $1::int
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

export async function searchAdminSessions(req, res) {
  try {
    const query = String(req.query.q || "").trim();
    const limit = clampNumber(req.query.limit, 25, 1, 100);

    if (!query) {
      return res.status(200).json({
        ok: true,
        query,
        items: []
      });
    }

    const pattern = `%${escapeLikePattern(query)}%`;

    const result = await db.query(
      `
      SELECT *
      FROM sessions
      WHERE id::text ILIKE $1 ESCAPE '\\'
        OR email ILIKE $1 ESCAPE '\\'
        OR name ILIKE $1 ESCAPE '\\'
        OR stripe_session_id ILIKE $1 ESCAPE '\\'
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT $2::int
      `,
      [pattern, limit]
    );

    return res.status(200).json({
      ok: true,
      query,
      count: result.rows.length,
      items: result.rows.map(buildCompactSessionView)
    });
  } catch (error) {
    console.error("Admin session search error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to search sessions"
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
      LIMIT $1::int
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

    const [analysisJobResult, webhookEventResult] = await Promise.all([
      db.query(
        `
        SELECT
          id,
          session_id,
          status,
          attempts,
          last_error,
          locked_at,
          locked_by,
          created_at,
          updated_at,
          processed_at
        FROM analysis_jobs
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 5
        `,
        [sessionId]
      ),
      db.query(
        `
        SELECT
          event_id,
          event_type,
          status,
          error_message,
          payload #>> '{data,object,id}' AS stripe_session_id,
          payload #>> '{data,object,metadata,internalSessionId}' AS internal_session_id,
          created_at,
          processed_at
        FROM webhook_events
        WHERE payload #>> '{data,object,metadata,internalSessionId}' = $1
           OR payload #>> '{data,object,id}' = $2
        ORDER BY created_at DESC
        LIMIT 5
        `,
        [sessionId, sessionRow.stripe_session_id || ""]
      )
    ]);

    return res.status(200).json({
      ok: true,
      session: buildSessionView(
        sessionRow,
        analysisJobResult.rows,
        webhookEventResult.rows
      )
    });
  } catch (error) {
    console.error("Admin session error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get session"
    });
  }
}

export async function downloadReportPdf(req, res) {
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
      return res.status(409).json({
        ok: false,
        error: "Session has no analysis result yet"
      });
    }

    const pdfBuffer = await generateReportPdfForSession(sessionRow);
    const filename = buildReportPdfFilename(sessionRow);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${filename}\"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Admin download report PDF error:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Failed to download report PDF"
    });
  }
}

export async function regenerateReportPdf(req, res) {
  try {
    const { sessionId } = req.params;

    const sessionRow = await getSessionById(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    const pdfBuffer = await generateReportPdfForSession(sessionRow);

    return res.status(200).json({
      ok: true,
      sessionId,
      pdfGenerated: true,
      pdfBytes: pdfBuffer.length,
      filename: buildReportPdfFilename(sessionRow),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Admin report PDF regenerate error:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Failed to regenerate report PDF"
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

export async function getInvoices(req, res) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 100);
    const items = await getRecentInvoices({ limit });

    return res.status(200).json({
      ok: true,
      provider: invoiceConfig.provider,
      configured: isInvoiceAutomationConfigured(),
      items
    });
  } catch (error) {
    console.error("Admin invoices error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get invoices"
    });
  }
}

export async function retryInvoice(req, res) {
  try {
    const { sessionId } = req.params;

    const invoice = await createInvoiceForSessionId(sessionId, {
      throwOnError: true
    });

    return res.status(200).json({
      ok: true,
      sessionId,
      invoice
    });
  } catch (error) {
    console.error("Admin retry invoice error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to retry invoice"
    });
  }
}
