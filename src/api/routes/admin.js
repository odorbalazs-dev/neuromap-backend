import express from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { getAdminDashboard } from "../controllers/admin-dashboard.controller.js";

import {
  getAdminStatus,
  getQueueStatus,
  getRecentSessions,
  getFailedAnalyses,
  getAdminSession,
  retryAnalysis,
  processOneAnalysisJob,
  resendReportEmail
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/dashboard", getAdminDashboard);

router.use(adminAuth);

router.get("/status", getAdminStatus);

router.get("/queue-status", getQueueStatus);
router.get("/recent-sessions", getRecentSessions);
router.get("/failed-analyses", getFailedAnalyses);

router.get("/session/:sessionId", getAdminSession);

router.post("/retry-analysis/:sessionId", retryAnalysis);
router.post("/process-one-job", processOneAnalysisJob);
router.post("/resend-email/:sessionId", resendReportEmail);

export default router;
