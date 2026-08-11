import {
  ConsentError,
  createConsentReceipt,
  getPublicLegalConfiguration,
  inspectConsentReceipt,
  withdrawConsentReceipt
} from "../../services/consent.service.js";
import { getSessionAccessTokenFromRequest } from "../../services/session.service.js";
import {
  createPrivacyRequest,
  getPrivacyRequestStatus,
  privacyRequestTokenFromRequest,
  verifyPrivacyRequest
} from "../../services/privacy-rights.service.js";

function readReceipt(req) {
  return {
    id: req.params.id,
    token: req.get("x-consent-token") || ""
  };
}

export function getLegalConfig(_req, res) {
  return res.status(200).json({
    ok: true,
    ...getPublicLegalConfiguration()
  });
}

export async function createLegalConsent(req, res) {
  try {
    const receipt = await createConsentReceipt(req.body || {});
    return res.status(201).json({ ok: true, receipt });
  } catch (error) {
    return handleConsentError(error, res);
  }
}

export async function getLegalConsent(req, res) {
  try {
    const consent = await inspectConsentReceipt(readReceipt(req));
    return res.status(200).json({ ok: true, consent });
  } catch (error) {
    return handleConsentError(error, res);
  }
}

export async function withdrawLegalConsent(req, res) {
  try {
    const result = await withdrawConsentReceipt(readReceipt(req));
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return handleConsentError(error, res);
  }
}

export async function submitPrivacyRequest(req, res) {
  try {
    const result = await createPrivacyRequest({
      sessionId: req.body?.sessionId,
      sessionToken: getSessionAccessTokenFromRequest(req),
      requestType: req.body?.requestType,
      language: req.body?.language,
      details: req.body?.details
    });

    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return handlePrivacyRequestError(error, res);
  }
}

export async function inspectPrivacyRequest(req, res) {
  try {
    const request = await getPrivacyRequestStatus(
      req.params.id,
      privacyRequestTokenFromRequest(req)
    );
    return res.status(200).json({ ok: true, request });
  } catch (error) {
    return handlePrivacyRequestError(error, res);
  }
}

export async function confirmPrivacyRequest(req, res) {
  try {
    const result = await verifyPrivacyRequest({
      requestId: req.params.id,
      requestToken: privacyRequestTokenFromRequest(req),
      code: req.body?.code
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return handlePrivacyRequestError(error, res);
  }
}

function handleConsentError(error, res) {
  if (error instanceof ConsentError) {
    return res.status(error.status).json({
      ok: false,
      error: error.message,
      code: error.code,
      details: error.details
    });
  }
  console.error("legal consent error:", error);
  return res.status(500).json({
    ok: false,
    error: "The consent service is temporarily unavailable."
  });
}

function handlePrivacyRequestError(error, res) {
  const status = Number(error?.status || 500);
  if (status >= 400 && status < 500) {
    return res.status(status).json({
      ok: false,
      error: error.message,
      code: error.code || "PRIVACY_REQUEST_ERROR"
    });
  }

  console.error("privacy request error:", error);
  return res.status(500).json({
    ok: false,
    error: "The privacy request service is temporarily unavailable."
  });
}
