import express from "express";

import {
  createLegalConsent,
  getLegalConfig,
  getLegalConsent,
  inspectPrivacyRequest,
  submitPrivacyRequest,
  withdrawLegalConsent
} from "../controllers/legal.controller.js";

const router = express.Router();

router.get("/config", getLegalConfig);
router.post("/consent", createLegalConsent);
router.get("/consent/:id", getLegalConsent);
router.post("/consent/:id/withdraw", withdrawLegalConsent);
router.post("/privacy-requests", submitPrivacyRequest);
router.get("/privacy-requests/:id", inspectPrivacyRequest);

export default router;
