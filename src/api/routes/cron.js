import express from "express";

import {
  recoverAbandonedCheckouts,
  runDataLifecycleCron,
  runObservationFollowUps,
  runPostPaymentRecovery,
  retryReportEmails,
  sendBankQualityAlert,
  sendOperationalAlert,
  sendProductionHealthAlert
} from "../controllers/cron.controller.js";

const router = express.Router();

router.post("/recover-checkouts", recoverAbandonedCheckouts);
router.post("/data-lifecycle", runDataLifecycleCron);
router.post("/post-payment-recovery", runPostPaymentRecovery);
router.post("/observation-follow-ups", runObservationFollowUps);
router.post("/retry-report-emails", retryReportEmails);
router.post("/production-health-alert", sendProductionHealthAlert);
router.post("/operational-alert", sendOperationalAlert);
router.post("/bank-quality-alert", sendBankQualityAlert);

export default router;
