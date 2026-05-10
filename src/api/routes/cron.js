import express from "express";

import {
  recoverAbandonedCheckouts,
  debugCronSecret
} from "../controllers/cron.controller.js";

const router = express.Router();

router.post("/recover-checkouts", recoverAbandonedCheckouts);
router.get("/debug-secret", debugCronSecret);

export default router;