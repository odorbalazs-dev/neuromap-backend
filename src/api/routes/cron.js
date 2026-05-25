import express from "express";

import {
  recoverAbandonedCheckouts,
  retryReportEmails,
  sendProductionHealthAlert
} from "../controllers/cron.controller.js";

const router = express.Router();

router.post("/recover-checkouts", recoverAbandonedCheckouts);
router.post("/retry-report-emails", retryReportEmails);
router.post("/production-health-alert", sendProductionHealthAlert);

export default router;
