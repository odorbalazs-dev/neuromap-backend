import express from "express";

import {
  recoverAbandonedCheckouts,
  retryReportEmails
} from "../controllers/cron.controller.js";

const router = express.Router();

router.post("/recover-checkouts", recoverAbandonedCheckouts);
router.post("/retry-report-emails", retryReportEmails);

export default router;
