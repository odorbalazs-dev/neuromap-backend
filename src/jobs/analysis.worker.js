import {
  claimNextAnalysisJob,
  calculateRetryDelaySeconds,
  markAnalysisJobDone,
  markAnalysisJobFailed,
  requeueStaleJobs
} from "../services/analysis-queue.service.js";
import { startAnalysisJobLease }
  from "../services/analysis-job-lease.service.js";

import {
  getSessionById,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed,
  markAnalysisQueued
} from "../services/session.service.js";

import { generateAnalysis }
  from "../services/analysis.service.js";

import { deliverReportEmailForSession }
  from "../services/report-email-delivery.service.js";

import { env } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import { db } from "../db/db.js";

const workerConfig = {
  concurrency: env.WORKER_CONCURRENCY,
  idleSleepMs: env.WORKER_IDLE_SLEEP_MS,
  errorSleepMs: env.WORKER_ERROR_SLEEP_MS,
  staleRequeueIntervalMs: env.WORKER_STALE_REQUEUE_INTERVAL_MS,
  staleJobMinutes: env.WORKER_STALE_JOB_MINUTES,
  heartbeatIntervalMs: env.WORKER_HEARTBEAT_INTERVAL_MS,
  maxAttempts: env.WORKER_MAX_ATTEMPTS,
  retryBaseSeconds: env.WORKER_RETRY_BASE_SECONDS,
  retryMaxSeconds: env.WORKER_RETRY_MAX_SECONDS
};

let lastStaleRequeueAt = 0;
let stopRequested = false;

async function processSingleJob(job, lease) {
  const session =
    await getSessionById(job.session_id);

  if (!session) {
    const error = new Error("Session not found");
    error.terminal = true;
    throw error;
  }

  if (session.analysis_status === "done" && session.analysis_result) {
    await lease.assertOwned();
    await deliverReportEmailForSession(
      session,
      { source: "worker-retry-email-only" }
    );

    return;
  }

  await markAnalysisProcessing(
    session.id
  );

  const resultText =
    await generateAnalysis({
      ...session.payload,
      lang: session.lang
    });

  await lease.assertOwned();
  await markAnalysisDone(
    session.id,
    resultText
  );

  await lease.assertOwned();
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
  console.log("[worker] analysis worker stopped");
}

async function workerLane(laneId) {
  while (!stopRequested) {
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

      const lease = startAnalysisJobLease(job, {
        source: `worker-lane-${laneId}`
      });

      try {
        await processSingleJob(job, lease);

        await lease.assertOwned();
        const completed = await markAnalysisJobDone(job.id, job.lease_token);

        if (!completed) {
          const error = new Error("Analysis job lease was lost before completion");
          error.code = "ANALYSIS_JOB_LEASE_LOST";
          error.terminal = true;
          throw error;
        }

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

        const retryDelaySeconds = calculateRetryDelaySeconds({
          attempts: job.attempts,
          baseSeconds: workerConfig.retryBaseSeconds,
          maxSeconds: workerConfig.retryMaxSeconds
        });

        const updatedJob = await markAnalysisJobFailed(
          job.id,
          job.lease_token,
          error.message,
          {
            maxAttempts: error.terminal ? 1 : workerConfig.maxAttempts,
            retryDelaySeconds
          }
        );

        if (!updatedJob) {
          console.warn("[worker] job lease no longer owned; status left unchanged", {
            jobId: job.id,
            laneId
          });
        } else if (updatedJob.status === "failed") {
          await markAnalysisFailed(
            job.session_id,
            error.message
          );
        } else {
          await markAnalysisQueued(job.session_id);

          console.warn(
            "[worker] job scheduled for retry",
            {
              jobId: job.id,
              laneId,
              attempts: job.attempts,
              retryDelaySeconds
            }
          );
        }
      } finally {
        await lease.stop();
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

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => {
    console.log(`[worker] ${signal} received; finishing active jobs`);
    stopRequested = true;
  });
}

async function main() {
  await runMigrations();
  await workerLoop();
  await db.close();
}

main().catch(async (error) => {
  console.error("[worker] fatal error", error);
  await db.close().catch(() => {});
  process.exitCode = 1;
});
