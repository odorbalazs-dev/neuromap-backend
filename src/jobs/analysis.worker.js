import {
  claimNextAnalysisJob,
  markAnalysisJobDone,
  markAnalysisJobFailed,
  requeueStaleJobs
} from "../services/analysis-queue.service.js";

import {
  getSessionById,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed
} from "../services/session.service.js";

import { generateAnalysis }
  from "../services/analysis.service.js";

import { deliverReportEmailForSession }
  from "../services/report-email-delivery.service.js";

import { env } from "../config/env.js";

const workerConfig = {
  concurrency: env.WORKER_CONCURRENCY,
  idleSleepMs: env.WORKER_IDLE_SLEEP_MS,
  errorSleepMs: env.WORKER_ERROR_SLEEP_MS,
  staleRequeueIntervalMs: env.WORKER_STALE_REQUEUE_INTERVAL_MS,
  staleJobMinutes: env.WORKER_STALE_JOB_MINUTES
};

let lastStaleRequeueAt = 0;

async function processSingleJob(job) {
  const session =
    await getSessionById(job.session_id);

  if (!session) {
    throw new Error("Session not found");
  }

  await markAnalysisProcessing(
    session.id
  );

  const resultText =
    await generateAnalysis({
      ...session.payload,
      lang: session.lang
    });

  await markAnalysisDone(
    session.id,
    resultText
  );

  await deliverReportEmailForSession(
    {
      ...session,
      analysis_result: resultText
    },
    { source: "worker" }
  );
}

async function workerLoop() {
  console.log(
    "[worker] analysis worker started",
    workerConfig
  );

  const lanes = Array.from(
    { length: workerConfig.concurrency },
    (_item, index) => workerLane(index + 1)
  );

  await Promise.all(lanes);
}

async function workerLane(laneId) {
  while (true) {
    try {
      await maybeRequeueStaleJobs(laneId);

      const job =
        await claimNextAnalysisJob();

      if (!job) {
        await sleep(workerConfig.idleSleepMs);
        continue;
      }

      console.log(
        "[worker] processing job",
        {
          jobId: job.id,
          laneId
        }
      );

      try {
        await processSingleJob(job);

        await markAnalysisJobDone(job.id);

        console.log(
          "[worker] job done",
          {
            jobId: job.id,
            laneId
          }
        );

      } catch (error) {
        console.error(
          "[worker] job failed",
          {
            jobId: job.id,
            laneId,
            error: error.message
          }
        );

        await markAnalysisFailed(
          job.session_id,
          error.message
        );

        await markAnalysisJobFailed(
          job.id,
          error.message
        );
      }

    } catch (error) {
      console.error(
        "[worker] loop error",
        {
          laneId,
          error: error.message
        }
      );

      await sleep(workerConfig.errorSleepMs);
    }
  }
}

async function maybeRequeueStaleJobs(laneId) {
  const now = Date.now();

  if (now - lastStaleRequeueAt < workerConfig.staleRequeueIntervalMs) {
    return;
  }

  lastStaleRequeueAt = now;

  const rows = await requeueStaleJobs({
    staleMinutes: workerConfig.staleJobMinutes
  });

  if (rows.length > 0) {
    console.warn(
      "[worker] stale jobs requeued",
      {
        laneId,
        count: rows.length,
        staleJobMinutes: workerConfig.staleJobMinutes
      }
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

workerLoop().catch((error) => {
  console.error(
    "[worker] fatal error",
    error
  );

  process.exit(1);
});
