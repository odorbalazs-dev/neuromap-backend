import express from "express";

import {
  createLegalConsent,
  getLegalConfig,
  getLegalConsent,
  withdrawLegalConsent
} from "../controllers/legal.controller.js";

const router = express.Router();

router.get("/config", getLegalConfig);
router.post("/consent", createLegalConsent);
router.get("/consent/:id", getLegalConsent);
router.post("/consent/:id/withdraw", withdrawLegalConsent);

export default router;
