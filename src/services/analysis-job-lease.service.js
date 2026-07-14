import { env } from "../config/env.js";
import {
  assertAnalysisJobLease,
  heartbeatAnalysisJob
} from "./analysis-queue.service.js";

export function startAnalysisJobLease(job, { source = "worker" } = {}) {
  let stopped = false;
  let lost = false;
  let heartbeatPromise = null;

  async function heartbeat() {
    if (stopped || heartbeatPromise) return;

    heartbeatPromise = heartbeatAnalysisJob(job.id, job.lease_token);

    try {
      if (!(await heartbeatPromise)) {
        lost = true;
      }
    } catch (error) {
      console.error("[analysis-lease] heartbeat failed", {
        source,
        jobId: job.id,
        error: error.message
      });
    } finally {
      heartbeatPromise = null;
    }
  }

  const timer = setInterval(heartbeat, env.WORKER_HEARTBEAT_INTERVAL_MS);
  timer.unref?.();

  return {
    async assertOwned() {
      if (heartbeatPromise) {
        await heartbeatPromise;
      }

      if (lost) {
        throw createLeaseLostError();
      }

      await assertAnalysisJobLease(job.id, job.lease_token);
    },

    async stop() {
      stopped = true;
      clearInterval(timer);

      if (heartbeatPromise) {
        await heartbeatPromise.catch(() => {});
      }
    }
  };
}

function createLeaseLostError() {
  const error = new Error("Analysis job lease was lost");
  error.code = "ANALYSIS_JOB_LEASE_LOST";
  error.terminal = true;
  return error;
}
