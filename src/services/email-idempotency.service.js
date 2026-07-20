import { createHash } from "node:crypto";

function normalizePart(value, label) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new Error(`Missing ${label} for email idempotency key.`);
  }

  return normalized;
}

export function buildRecordEmailIdempotencyKey(namespace, recordId) {
  const safeNamespace = normalizePart(namespace, "namespace");
  const safeRecordId = normalizePart(recordId, "record id");
  return `${safeNamespace}/${safeRecordId}`;
}

export function buildReportEmailIdempotencyKey(sessionId, reportText) {
  const reportDigest = createHash("sha256")
    .update(String(reportText || ""), "utf8")
    .digest("hex")
    .slice(0, 24);

  return `${buildRecordEmailIdempotencyKey("report-email", sessionId)}/${reportDigest}`;
}
