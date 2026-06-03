import express from "express";

import {
  recoverAbandonedCheckouts,
  runPostPaymentRecovery,
  retryReportEmails,
  sendBankQualityAlert,
  sendOperationalAlert,
  sendProductionHealthAlert
} from "../controllers/cron.controller.js";

const router = express.Router();

router.post("/recover-checkouts", recoverAbandonedCheckouts);
router.post("/post-payment-recovery", runPostPaymentRecovery);
router.post("/retry-report-emails", retryReportEmails);
router.post("/production-health-alert", sendProductionHealthAlert);
router.post("/operational-alert", sendOperationalAlert);
router.post("/bank-quality-alert", sendBankQualityAlert);

export default router;
