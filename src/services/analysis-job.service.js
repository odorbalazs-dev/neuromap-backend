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
import { startAnalysisJobLease } from "./analysis-job-lease.service.js";
import { generateAnalysis } from "./analysis.service.js";
import { deliverReportEmailForSession } from "./report-email-delivery.service.js";
import { env } from "../config/env.js";
import {
  assertSessionProcessingAllowed,
  assertSessionProcessingAllowedRecord,
  ProcessingRestrictedError
} from "./data-governance.service.js";

export async function processNextAnalysisJob() {
  const job = await claimNextAnalysisJob();

  if (!job) {
    return {
      processed: false,
      reason: "no_queued_analysis"
    };
  }

  const lease = startAnalysisJobLease(job, { source: "analysis-job-service" });
  let session = null;

  try {
    session = await getSessionById(job.session_id);

    if (!session) {
      const error = new Error("Session not found");
      error.code = "SESSION_NOT_FOUND";
      error.terminal = true;
      throw error;
    }

    assertSessionProcessingAllowedRecord(session);

    if (session.analysis_status === "done" && session.analysis_result) {
      await lease.assertOwned();
      await deliverReportEmailForSession(session, { source: "analysis-job-email-only" });
      await lease.assertOwned();

      if (!(await markAnalysisJobDone(job.id, job.lease_token))) {
        throw createLeaseLostError();
      }

      return {
        processed: true,
        jobId: job.id,
        sessionId: session.id,
        emailOnlyRetry: true
      };
    }

    const processingSession = await markAnalysisProcessing(session.id);
    if (!processingSession) {
      await assertSessionProcessingAllowed(session.id);
      throw new ProcessingRestrictedError();
    }

    const resultText = await generateAnalysis({
      ...(session.payload || {}),
      lang: session.lang
    });

    await assertSessionProcessingAllowed(session.id);
    await lease.assertOwned();
    const completedSession = await markAnalysisDone(session.id, resultText);
    if (!completedSession) {
      await assertSessionProcessingAllowed(session.id);
      throw new ProcessingRestrictedError();
    }

    await assertSessionProcessingAllowed(session.id);
    await lease.assertOwned();
    await deliverReportEmailForSession(
      {
        ...session,
        analysis_result: resultText
      },
      { source: "analysis-job" }
    );

    await lease.assertOwned();

    if (!(await markAnalysisJobDone(job.id, job.lease_token))) {
      throw createLeaseLostError();
    }

    return {
      processed: true,
      jobId: job.id,
      sessionId: session.id
    };
  } catch (error) {
    const message = error?.message || "Analysis job failed";

    console.error("[analysis-job] failed:", {
      sessionId: session?.id || job.session_id,
      message
    });

    const retryDelaySeconds = calculateRetryDelaySeconds({
      attempts: job.attempts,
      baseSeconds: env.WORKER_RETRY_BASE_SECONDS,
      maxSeconds: env.WORKER_RETRY_MAX_SECONDS
    });

    const updatedJob = await markAnalysisJobFailed(job.id, job.lease_token, message, {
      maxAttempts: error.terminal ? 1 : env.WORKER_MAX_ATTEMPTS,
      retryDelaySeconds
    });

    if (error.code === "SESSION_NOT_FOUND") {
      return {
        processed: false,
        reason: "session_not_found",
        jobId: job.id
      };
    } else if (error.code === "PROCESSING_RESTRICTED") {
      return {
        processed: false,
        reason: "processing_restricted",
        jobId: job.id,
        sessionId: session?.id || job.session_id
      };
    } else if (!updatedJob) {
      console.warn("[analysis-job] lease no longer owned; status left unchanged", {
        jobId: job.id
      });
    } else if (session && updatedJob.status === "failed") {
      await markAnalysisFailed(session.id, message);
    } else if (session) {
      await markAnalysisQueued(session.id);
    }

    throw error;
  } finally {
    await lease.stop();
  }
}

function createLeaseLostError() {
  const error = new Error("Analysis job lease was lost before completion");
  error.code = "ANALYSIS_JOB_LEASE_LOST";
  error.terminal = true;
  return error;
}
