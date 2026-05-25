import { getReportEmailRetryCandidates } from "./session.service.js";
import { deliverReportEmailForSession } from "./report-email-delivery.service.js";

function normalizeNumber(value, fallback, min, max) {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return fallback;
  }

  return Math.min(
    Math.max(num, min),
    max
  );
}

export function normalizeReportEmailRetryOptions(options = {}) {
  return {
    limit: normalizeNumber(options.limit, 20, 1, 100),
    maxAttempts: normalizeNumber(options.maxAttempts, 3, 1, 10),
    retryAfterMinutes: normalizeNumber(options.retryAfterMinutes, 10, 1, 1440),
    staleSendingMinutes: normalizeNumber(options.staleSendingMinutes, 15, 5, 1440)
  };
}

export async function retryReportEmailsBatch(options = {}, { source = "report-email-retry" } = {}) {
  const normalized = normalizeReportEmailRetryOptions(options);

  const sessions =
    await getReportEmailRetryCandidates(normalized);

  const results = [];

  for (const session of sessions) {
    const previousStatus =
      session.report_email_status || "not_sent";

    const attemptsBefore =
      Number(session.report_email_attempts || 0);

    const result =
      await deliverReportEmailForSession(
        session,
        { source }
      );

    results.push({
      ...result,
      previousStatus,
      attemptsBefore
    });
  }

  return {
    ok: true,
    checked: sessions.length,
    sent: results.filter((item) => item.status === "sent").length,
    failed: results.filter((item) => item.status === "failed").length,
    ...normalized,
    results
  };
}
