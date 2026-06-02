import express from "express";

import {
  recoverAbandonedCheckouts,
  retryReportEmails,
  sendBankQualityAlert,
  sendProductionHealthAlert
} from "../controllers/cron.controller.js";

const router = express.Router();

router.post("/recover-checkouts", recoverAbandonedCheckouts);
router.post("/retry-report-emails", retryReportEmails);
router.post("/production-health-alert", sendProductionHealthAlert);
router.post("/bank-quality-alert", sendBankQualityAlert);

export default router;
