import {
  getSessionById,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed,
  markAnalysisQueued
} from "./session.service.js";
import {
  claimNextAnalysisJob,
  calculateRetryDelaySeconds,
  markAnalysisJobDone,
  markAnalysisJobFailed
} from "./analysis-queue.service.js";
import { generateAnalysis } from "./analysis.service.js";
import { deliverReportEmailForSession } from "./report-email-delivery.service.js";
import { env } from "../config/env.js";

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
    await markAnalysisJobFailed(job.id, "Session not found", {
      maxAttempts: 1,
      retryDelaySeconds: 0
    });

    return {
      processed: false,
      reason: "session_not_found",
      jobId: job.id
    };
  }

  try {
    if (session.analysis_status === "done" && session.analysis_result) {
      await deliverReportEmailForSession(session, { source: "analysis-job-email-only" });
      await markAnalysisJobDone(job.id);

      return {
        processed: true,
        jobId: job.id,
        sessionId: session.id,
        emailOnlyRetry: true
      };
    }

    await markAnalysisProcessing(session.id);

    const resultText = await generateAnalysis({
      ...(session.payload || {}),
      lang: session.lang
    });

    await markAnalysisDone(session.id, resultText);

    await deliverReportEmailForSession(
      {
        ...session,
        analysis_result: resultText
      },
      { source: "analysis-job" }
    );

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

    const retryDelaySeconds = calculateRetryDelaySeconds({
      attempts: job.attempts,
      baseSeconds: env.WORKER_RETRY_BASE_SECONDS,
      maxSeconds: env.WORKER_RETRY_MAX_SECONDS
    });

    const updatedJob = await markAnalysisJobFailed(job.id, message, {
      maxAttempts: env.WORKER_MAX_ATTEMPTS,
      retryDelaySeconds
    });

    if (updatedJob?.status === "failed") {
      await markAnalysisFailed(session.id, message);
    } else {
      await markAnalysisQueued(session.id);
    }

    throw error;
  }
}
