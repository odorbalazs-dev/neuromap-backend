import {
  markReportEmailSending,
  markReportEmailSent,
  markReportEmailFailed
} from "./session.service.js";
import { sendReportEmail } from "./email.service.js";

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

  await markReportEmailSending(sessionId);

  try {
    const response = await sendReportEmail({
      to: sessionRow.email,
      lang: sessionRow.lang,
      name: sessionRow.name,
      reportText: sessionRow.analysis_result,
      payload: sessionRow.payload
    });

    const providerId = getEmailProviderId(response);

    await markReportEmailSent(sessionId, providerId);

    return {
      ok: true,
      sessionId,
      status: "sent",
      providerId
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
