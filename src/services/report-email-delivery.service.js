import {
  markReportEmailSending,
  markReportEmailSent,
  markReportEmailFailed
} from "./session.service.js";
import { sendReportEmail } from "./email.service.js";
import { getProductPackage } from "../config/products.js";
import { ensureObservationProgram } from "./observation-program.service.js";
import { assertSessionProcessingAllowed } from "./data-governance.service.js";
import { buildReportEmailIdempotencyKey } from "./email-idempotency.service.js";

export { buildReportEmailIdempotencyKey } from "./email-idempotency.service.js";

export function getEmailProviderId(response) {
  return response?.data?.id || response?.id || null;
}

export async function deliverReportEmailForSession(
  sessionRow,
  {
    source = "report-email",
    throwOnFailure = false
  } = {}
) {
  const sessionId = sessionRow?.id;

  if (!sessionId) {
    throw new Error("Missing session id for report email delivery.");
  }

  if (!sessionRow.analysis_result) {
    throw new Error("No analysis result found for this session.");
  }

  await assertSessionProcessingAllowed(sessionId);
  const claimedSession = await markReportEmailSending(sessionId);

  if (!claimedSession) {
    return {
      ok: true,
      sessionId,
      status: "skipped",
      skipped: true,
      reason: "report_email_already_sent_or_in_progress"
    };
  }

  try {
    const deliverableSession = {
      ...sessionRow,
      ...claimedSession,
      payload: sessionRow.payload || claimedSession.payload,
      analysis_result: sessionRow.analysis_result || claimedSession.analysis_result
    };

    const productPackage = getProductPackage(
      deliverableSession.package_code || "legacy_500_v1"
    );
    const observationProgram = productPackage.entitlements.observationDiary14Days
      ? await ensureObservationProgram(deliverableSession)
      : null;

    await assertSessionProcessingAllowed(sessionId);
    const response = await sendReportEmail({
      to: deliverableSession.email,
      lang: deliverableSession.lang,
      name: deliverableSession.name,
      reportText: deliverableSession.analysis_result,
      payload: deliverableSession.payload,
      productPackage,
      observationProgram,
      idempotencyKey: buildReportEmailIdempotencyKey(
        sessionId,
        deliverableSession.analysis_result
      )
    });

    const providerId = getEmailProviderId(response);

    await markReportEmailSent(sessionId, providerId);

    return {
      ok: true,
      sessionId,
      status: "sent",
      providerId,
      packageCode: productPackage.code
    };
  } catch (error) {
    const message =
      error?.message ||
      "Report email delivery failed.";

    await markReportEmailFailed(sessionId, message);

    console.error(`[${source}] report email failed`, {
      sessionId,
      error: message
    });

    if (throwOnFailure) {
      throw error;
    }

    return {
      ok: false,
      sessionId,
      status: "failed",
      error: message
    };
  }
}
