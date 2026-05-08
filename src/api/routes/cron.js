import express from "express";

import {
  recoverAbandonedCheckouts
} from "../controllers/cron.controller.js";

const router = express.Router();

router.post(
  "/recover-checkouts",
  recoverAbandonedCheckouts
);

export default router;