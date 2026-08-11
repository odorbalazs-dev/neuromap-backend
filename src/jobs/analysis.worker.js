import { requeueStaleJobs } from "../services/analysis-queue.service.js";
import { processNextAnalysisJob } from "../services/analysis-job.service.js";

import { env } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import { db } from "../db/db.js";

const workerConfig = {
  concurrency: env.WORKER_CONCURRENCY,
  idleSleepMs: env.WORKER_IDLE_SLEEP_MS,
  errorSleepMs: env.WORKER_ERROR_SLEEP_MS,
  staleRequeueIntervalMs: env.WORKER_STALE_REQUEUE_INTERVAL_MS,
  staleJobMinutes: env.WORKER_STALE_JOB_MINUTES,
  heartbeatIntervalMs: env.WORKER_HEARTBEAT_INTERVAL_MS
};

let lastStaleRequeueAt = 0;
let stopRequested = false;

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

      const result = await processNextAnalysisJob();

      if (!result.processed && result.reason === "no_queued_analysis") {
        await sleep(workerConfig.idleSleepMs);
        continue;
      }

      console.log("[worker] job cycle complete", {
        laneId,
        jobId: result.jobId || null,
        sessionId: result.sessionId || null,
        outcome: result.reason || (result.emailOnlyRetry ? "email_only" : "processed")
      });

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
  if (env.SERVICE_ROLE !== "worker") {
    throw new Error(
      `Analysis worker started with service role "${env.SERVICE_ROLE}" ` +
        `(source: ${env.SERVICE_ROLE_SOURCE}).`
    );
  }

  console.log("[worker] runtime role verified", {
    role: env.SERVICE_ROLE,
    source: env.SERVICE_ROLE_SOURCE
  });

  await runMigrations();
  await workerLoop();
  await db.close();
}

main().catch(async (error) => {
  console.error("[worker] fatal error", error);

  if (error?.code === "SELF_SIGNED_CERT_IN_CHAIN") {
    console.error(
      "[worker] Railway database TLS validation failed. Use a Postgres " +
        "DATABASE_URL variable reference/private network with DATABASE_SSL_MODE=auto, " +
        "or provide DATABASE_SSL_CA_BASE64 for certificate verification."
    );
  }

  await db.close().catch(() => {});
  process.exitCode = 1;
});
