import express from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { createRateLimit } from "../../middleware/security.js";
import { getAdminDashboard } from "../controllers/admin-dashboard.controller.js";

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
  resetReportEmailRetryForSession
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/dashboard", getAdminDashboard);

router.use(createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 220,
  keyPrefix: "admin-api"
}));

router.use(adminAuth);

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

router.get("/session/:sessionId", getAdminSession);
router.get("/session/:sessionId/report-pdf", downloadReportPdf);
router.post("/session/:sessionId/regenerate-pdf", regenerateReportPdf);

router.post("/retry-analysis/:sessionId", retryAnalysis);
router.post("/process-one-job", processOneAnalysisJob);
router.post("/resend-email/:sessionId", resendReportEmail);
router.post("/retry-report-emails", retryReportEmailBatch);
router.post("/reset-email-retry/:sessionId", resetReportEmailRetryForSession);

export default router;
