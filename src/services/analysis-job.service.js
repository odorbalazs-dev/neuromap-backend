import {
  getSessionById,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed,
  markReportEmailSending,
  markReportEmailSent,
  markReportEmailFailed
} from "./session.service.js";
import {
  claimNextAnalysisJob,
  markAnalysisJobDone,
  markAnalysisJobFailed
} from "./analysis-queue.service.js";
import { generateAnalysis } from "./analysis.service.js";
import { sendReportEmail } from "./email.service.js";

function getEmailProviderId(response) {
  return response?.data?.id || response?.id || null;
}

export async function processNextAnalysisJob() {
  const job = await claimNextAnalysisJob();

  if (!job) {
    return {
      processed: false,
      reason: "no_queued_analysis"
    };
  }

  const session = await getSessionById(job.session_id);

  if (!session) {
    await markAnalysisJobFailed(job.id, "Session not found");

    return {
      processed: false,
      reason: "session_not_found",
      jobId: job.id
    };
  }

  try {
    await markAnalysisProcessing(session.id);

    const resultText = await generateAnalysis({
      ...(session.payload || {}),
      lang: session.lang
    });

    await markAnalysisDone(session.id, resultText);

    await markReportEmailSending(session.id);

    try {
      const emailResponse = await sendReportEmail({
        to: session.email,
        lang: session.lang,
        name: session.name,
        reportText: resultText,
        payload: session.payload
      });

      await markReportEmailSent(
        session.id,
        getEmailProviderId(emailResponse)
      );
    } catch (emailError) {
      const emailMessage =
        emailError?.message ||
        "Report email failed after analysis completed.";

      await markReportEmailFailed(session.id, emailMessage);

      console.error("[analysis-job] report email failed:", {
        sessionId: session.id,
        message: emailMessage
      });
    }

    await markAnalysisJobDone(job.id);

    return {
      processed: true,
      jobId: job.id,
      sessionId: session.id
    };
  } catch (error) {
    const message = error?.message || "Analysis job failed";

    console.error("[analysis-job] failed:", {
      sessionId: session.id,
      message
    });

    await markAnalysisFailed(session.id, message);
    await markAnalysisJobFailed(job.id, message);

    throw error;
  }
}
