import express from "express";

import {
  createLegalConsent,
  confirmPrivacyRequest,
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
router.post("/privacy-requests/:id/verify", confirmPrivacyRequest);
router.get("/privacy-requests/:id", inspectPrivacyRequest);

export default router;
