import express from "express";
import {
  adminAuth,
  adminLogin,
  adminLogout,
  getAdminAuthStatus
} from "../../middleware/adminAuth.js";
import { createRateLimit } from "../../middleware/security.js";
import { getAdminDashboard } from "../controllers/admin-dashboard.controller.js";
import { getOperationalEvidence } from "../../services/operational-scheduler.service.js";
import { db } from "../../db/db.js";

import {
  getAdminStatus,
  getLaunchReadiness,
  getProductionHealth,
  getDashboardMetrics,
  getEmailDeliverability,
  getEmailDeliveryCenter,
  getPostPaymentMonitoring,
  triggerPostPaymentRecovery,
  getFollowUpEmails,
  runFollowUpEmails,
  getWebflowEmbedManager,
  getI18nQualityAudit,
  getOperationsLog,
  getAdminAlerts,
  triggerAdminAlertCheck,
  triggerBankQualityAlertCheck,
  triggerOperationalAlertCheck,
  getEngineAnalytics,
  getEngineDecisionAudit,
  getBankQualityAudit,
  getQueueStatus,
  getRecentSessions,
  searchAdminSessions,
  getFailedAnalyses,
  getAdminSession,
  downloadReportPdf,
  regenerateReportPdf,
  retryAnalysis,
  processOneAnalysisJob,
  resendReportEmail,
  retryReportEmailBatch,
  resetReportEmailRetryForSession,
  getInvoices,
  retryInvoice
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/dashboard", getAdminDashboard);

router.use(createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 220,
  keyPrefix: "admin-api"
}));

router.post("/login", createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "admin-login",
  failClosed: true
}), adminLogin);
router.post("/logout", adminLogout);
router.get("/session", adminAuth, getAdminAuthStatus);

router.use(adminAuth);
router.get('/payment-reviews', async (_req, res) => {
  try {
    const result = await db.query(`SELECT id,session_id,reason,amount,currency,state,created_at
      FROM payment_reviews WHERE state='open' ORDER BY created_at LIMIT 100`);
    res.json({ ok: true, reviews: result.rows });
  } catch { res.status(503).json({ ok: false, error: 'Payment review list unavailable' }); }
});
router.post('/payment-reviews/:id/resolve', async (req, res) => {
  const { resolution, verified } = req.body || {};
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(req.params.id) || verified !== true
      || typeof resolution !== 'string' || resolution.trim().length < 20 || resolution.length > 1000) {
    return res.status(400).json({ ok: false, error: 'A verified resolution and evidence reference are required.' });
  }
  try {
    // Closing a work item never changes payment, consent or processing restrictions.
    const result = await db.query(`UPDATE payment_reviews SET state='resolved',resolution=$2,resolved_at=NOW(),resolved_by=$3
      WHERE id=$1 AND state='open' RETURNING id`, [req.params.id,resolution.trim(),req.adminSession?.id || 'admin-token']);
    res.status(result.rowCount ? 200 : 404).json({ ok: Boolean(result.rowCount) });
  } catch { res.status(503).json({ ok: false, error: 'Payment review update unavailable' }); }
});
router.get("/operational-evidence", async (_req, res) => {
  try { res.json(await getOperationalEvidence()); }
  catch (_error) { res.status(503).json({ ok: false, error: "Operational evidence unavailable" }); }
});

router.get("/status", getAdminStatus);
router.get("/launch-readiness", getLaunchReadiness);
router.get("/production-health", getProductionHealth);
router.get("/dashboard-metrics", getDashboardMetrics);
router.get("/email-deliverability", getEmailDeliverability);
router.get("/email-delivery-center", getEmailDeliveryCenter);
router.get("/post-payment-monitoring", getPostPaymentMonitoring);
router.post("/post-payment-recovery", triggerPostPaymentRecovery);
router.get("/follow-up-emails", getFollowUpEmails);
router.post("/run-follow-up-emails", runFollowUpEmails);
router.get("/webflow-embed-manager", getWebflowEmbedManager);
router.get("/i18n-quality-audit", getI18nQualityAudit);
router.get("/operations-log", getOperationsLog);
router.get("/alerts", getAdminAlerts);
router.post("/trigger-alert-check", triggerAdminAlertCheck);
router.post("/trigger-operational-alert-check", triggerOperationalAlertCheck);
router.post("/trigger-bank-quality-alert-check", triggerBankQualityAlertCheck);
router.get("/engine-analytics", getEngineAnalytics);
router.get("/engine-decision-audit", getEngineDecisionAudit);
router.get("/bank-quality-audit", getBankQualityAudit);

router.get("/queue-status", getQueueStatus);
router.get("/recent-sessions", getRecentSessions);
router.get("/search-sessions", searchAdminSessions);
router.get("/failed-analyses", getFailedAnalyses);
router.get("/invoices", getInvoices);

router.get("/session/:sessionId", getAdminSession);
router.get("/session/:sessionId/report-pdf", downloadReportPdf);
router.post("/session/:sessionId/regenerate-pdf", regenerateReportPdf);

router.post("/retry-analysis/:sessionId", retryAnalysis);
router.post("/retry-invoice/:sessionId", retryInvoice);
router.post("/process-one-job", processOneAnalysisJob);
router.post("/resend-email/:sessionId", resendReportEmail);
router.post("/retry-report-emails", retryReportEmailBatch);
router.post("/reset-email-retry/:sessionId", resetReportEmailRetryForSession);

export default router;
