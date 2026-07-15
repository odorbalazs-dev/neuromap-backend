import {
  ConsentError,
  createConsentReceipt,
  getPublicLegalConfiguration,
  inspectConsentReceipt,
  withdrawConsentReceipt
} from "../../services/consent.service.js";

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
