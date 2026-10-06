import express from "express";
import { renderLegalPage } from "../../services/legal-pages.service.js";

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

for (const kind of ["privacy", "terms", "support"]) {
  router.get(`/${kind}`, (req, res) => {
    // Legal documents need only our stylesheet; scripts and embeds stay blocked.
    res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    res.type("html").send(renderLegalPage(kind, req.query.lang));
  });
}

router.get("/config", getLegalConfig);
router.post("/consent", createLegalConsent);
router.get("/consent/:id", getLegalConsent);
router.post("/consent/:id/withdraw", withdrawLegalConsent);
router.post("/privacy-requests", submitPrivacyRequest);
router.post("/privacy-requests/:id/verify", confirmPrivacyRequest);
router.get("/privacy-requests/:id", inspectPrivacyRequest);

export default router;
