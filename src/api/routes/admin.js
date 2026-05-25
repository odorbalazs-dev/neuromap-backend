import express from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { getAdminDashboard } from "../controllers/admin-dashboard.controller.js";

import {
  getAdminStatus,
  getProductionHealth,
  getOperationsLog,
  getQueueStatus,
  getRecentSessions,
  getFailedAnalyses,
  getAdminSession,
  retryAnalysis,
  processOneAnalysisJob,
  resendReportEmail,
  retryReportEmailBatch,
  resetReportEmailRetryForSession
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/dashboard", getAdminDashboard);

router.use(adminAuth);

router.get("/status", getAdminStatus);
router.get("/production-health", getProductionHealth);
router.get("/operations-log", getOperationsLog);

router.get("/queue-status", getQueueStatus);
router.get("/recent-sessions", getRecentSessions);
router.get("/failed-analyses", getFailedAnalyses);

router.get("/session/:sessionId", getAdminSession);

router.post("/retry-analysis/:sessionId", retryAnalysis);
router.post("/process-one-job", processOneAnalysisJob);
router.post("/resend-email/:sessionId", resendReportEmail);
router.post("/retry-report-emails", retryReportEmailBatch);
router.post("/reset-email-retry/:sessionId", resetReportEmailRetryForSession);

export default router;
