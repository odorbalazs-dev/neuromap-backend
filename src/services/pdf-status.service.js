import { db } from "../db/db.js";

export async function recordPdfState(sessionId, state, details = {}) {
  if (!["generating", "ready", "failed"].includes(state)) throw new Error("Invalid PDF state");
  await db.query(`UPDATE sessions SET pdf_status = $2,
    pdf_started_at = CASE WHEN $2 = 'generating' THEN NOW() ELSE pdf_started_at END,
    pdf_completed_at = CASE WHEN $2 = 'ready' THEN NOW() WHEN $2 = 'generating' THEN NULL ELSE pdf_completed_at END,
    pdf_error_code = CASE WHEN $2 = 'failed' THEN 'PDF_GENERATION_FAILED' ELSE NULL END,
    pdf_bytes = CASE WHEN $2 = 'ready' THEN $3::int ELSE pdf_bytes END,
    pdf_sha256 = CASE WHEN $2 = 'ready' THEN $4 ELSE pdf_sha256 END,
    updated_at = NOW()
    WHERE id = $1 AND sensitive_data_erased_at IS NULL AND data_redacted_at IS NULL`,
  [sessionId, state, details.bytes || null, details.sha256 || null]);
}
