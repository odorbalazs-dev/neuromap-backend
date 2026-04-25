import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getAdminSession,
  retryAnalysis,
  resendReportEmail
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(adminAuth);

router.get("/session/:sessionId", getAdminSession);
router.post("/retry-analysis/:sessionId", retryAnalysis);
router.post("/resend-email/:sessionId", resendReportEmail);

export default router;