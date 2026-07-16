import os from "os";
import { db } from "../db/db.js";

const WORKER_ID =
  `${os.hostname()}-${process.pid}`;

export function calculateRetryDelaySeconds({
  attempts = 1,
  baseSeconds = 60,
  maxSeconds = 900
} = {}) {
  const safeAttempts = Math.max(1, Number(attempts || 1));
  const safeBase = Math.max(5, Number(baseSeconds || 60));
  const safeMax = Math.max(safeBase, Number(maxSeconds || 900));
  const exponent = Math.min(8, safeAttempts - 1);

  return Math.min(safeMax, Math.round(safeBase * (2 ** exponent)));
}

export async function enqueueAnalysisJob(sessionId) {
  const result = await db.query(
    `
    INSERT INTO analysis_jobs (
      session_id,
      status,
      next_attempt_at,
      failed_at
    )
    SELECT id, 'queued', NOW(), NULL
    FROM sessions
    WHERE id = $1
      AND processing_restricted_at IS NULL
      AND sensitive_data_erased_at IS NULL
      AND data_redacted_at IS NULL
    ON CONFLICT (session_id)
    WHERE status IN ('queued', 'processing')
    DO NOTHING
    RETURNING *
    `,
    [sessionId]
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  const existing = await db.query(
    `
    SELECT *
    FROM analysis_jobs job
    JOIN sessions session ON session.id = job.session_id
    WHERE job.session_id = $1
      AND job.status IN ('queued', 'processing')
      AND session.processing_restricted_at IS NULL
      AND session.sensitive_data_erased_at IS NULL
      AND session.data_redacted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [sessionId]
  );

  return existing.rows[0] || null;
}

export async function claimNextAnalysisJob() {
  const result = await db.query(
    `
    UPDATE analysis_jobs
    SET
      status = 'processing',
      locked_at = NOW(),
      locked_by = $1,
      lease_token = gen_random_uuid(),
      heartbeat_at = NOW(),
      attempts = attempts + 1,
      updated_at = NOW()
    WHERE id = (
      SELECT job.id
      FROM analysis_jobs job
      JOIN sessions session ON session.id = job.session_id
      WHERE job.status = 'queued'
        AND (job.next_attempt_at IS NULL OR job.next_attempt_at <= NOW())
        AND session.processing_restricted_at IS NULL
        AND session.sensitive_data_erased_at IS NULL
        AND session.data_redacted_at IS NULL
      ORDER BY job.created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
    `,
    [WORKER_ID]
  );

  return result.rows[0] || null;
}

export async function heartbeatAnalysisJob(jobId, leaseToken) {
  const result = await db.query(
    `
    UPDATE analysis_jobs
    SET
      heartbeat_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
      AND status = 'processing'
      AND lease_token = $2::uuid
    RETURNING id
    `,
    [jobId, leaseToken]
  );

  return Boolean(result.rows[0]);
}

export async function assertAnalysisJobLease(jobId, leaseToken) {
  const result = await db.query(
    `
    SELECT id
    FROM analysis_jobs
    WHERE id = $1
      AND status = 'processing'
      AND lease_token = $2::uuid
    `,
    [jobId, leaseToken]
  );

  if (!result.rows[0]) {
    const error = new Error("Analysis job lease was lost");
    error.code = "ANALYSIS_JOB_LEASE_LOST";
    error.terminal = true;
    throw error;
  }
}

export async function markAnalysisJobDone(jobId, leaseToken) {
  const result = await db.query(
    `
    UPDATE analysis_jobs
    SET
      status = 'done',
      locked_at = NULL,
      locked_by = NULL,
      lease_token = NULL,
      heartbeat_at = NULL,
      next_attempt_at = NULL,
      failed_at = NULL,
      processed_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
      AND status = 'processing'
      AND lease_token = $2::uuid
    RETURNING id
    `,
    [jobId, leaseToken]
  );

  return Boolean(result.rows[0]);
}

export async function markAnalysisJobFailed(
  jobId,
  leaseToken,
  errorMessage,
  {
    maxAttempts = 4,
    retryDelaySeconds = 60
  } = {}
) {
  const result = await db.query(
    `
    UPDATE analysis_jobs
    SET
      status = CASE
        WHEN attempts >= $3::int THEN 'failed'
        ELSE 'queued'
      END,
      last_error = $4,
      locked_at = NULL,
      locked_by = NULL,
      lease_token = NULL,
      heartbeat_at = NULL,
      next_attempt_at = CASE
        WHEN attempts >= $3::int THEN NULL
        ELSE NOW() + ($5::int * INTERVAL '1 second')
      END,
      failed_at = CASE
        WHEN attempts >= $3::int THEN NOW()
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = $1
      AND status = 'processing'
      AND lease_token = $2::uuid
    RETURNING *
    `,
    [jobId, leaseToken, maxAttempts, errorMessage, retryDelaySeconds]
  );

  return result.rows[0] || null;
}

export async function requeueStaleJobs({
  staleMinutes = 15
} = {}) {
  const result = await db.query(
    `
    UPDATE analysis_jobs job
    SET
      status = 'queued',
      locked_at = NULL,
      locked_by = NULL,
      lease_token = NULL,
      heartbeat_at = NULL,
      next_attempt_at = NOW(),
      updated_at = NOW()
    FROM sessions session
    WHERE job.session_id = session.id
      AND job.status = 'processing'
      AND session.processing_restricted_at IS NULL
      AND session.sensitive_data_erased_at IS NULL
      AND session.data_redacted_at IS NULL
      AND COALESCE(job.heartbeat_at, job.locked_at) < NOW() - ($1::int * INTERVAL '1 minute')
    RETURNING job.id
    `,
    [staleMinutes]
  );

  return result.rows;
}

export async function getAnalysisQueueSnapshot() {
  const result = await db.query(`
    WITH stats AS (
      SELECT
        COUNT(*) FILTER (WHERE status = 'queued')::int AS queued,
        COUNT(*) FILTER (
          WHERE status = 'queued'
            AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
        )::int AS queued_ready,
        COUNT(*) FILTER (
          WHERE status = 'queued'
            AND next_attempt_at > NOW()
        )::int AS queued_delayed,
        COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
        COUNT(*) FILTER (WHERE status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
        COUNT(*) FILTER (
          WHERE status = 'done'
            AND processed_at >= NOW() - INTERVAL '24 hours'
        )::int AS done_24h,
        COUNT(*) FILTER (
          WHERE status = 'failed'
            AND failed_at >= NOW() - INTERVAL '24 hours'
        )::int AS failed_24h,
        MIN(created_at) FILTER (
          WHERE status = 'queued'
            AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
        ) AS oldest_queued_at,
        MIN(next_attempt_at) FILTER (
          WHERE status = 'queued'
            AND next_attempt_at > NOW()
        ) AS next_retry_at,
        MIN(COALESCE(heartbeat_at, locked_at)) FILTER (
          WHERE status = 'processing'
        ) AS oldest_processing_at
      FROM analysis_jobs
    )
    SELECT
      *,
      CASE
        WHEN oldest_queued_at IS NULL THEN NULL
        ELSE EXTRACT(EPOCH FROM (NOW() - oldest_queued_at))::int
      END AS oldest_queued_age_seconds,
      CASE
        WHEN oldest_processing_at IS NULL THEN NULL
        ELSE EXTRACT(EPOCH FROM (NOW() - oldest_processing_at))::int
      END AS oldest_processing_age_seconds
    FROM stats
  `);

  const row = result.rows[0] || {};

  return {
    counts: {
      queued: Number(row.queued || 0),
      queuedReady: Number(row.queued_ready || 0),
      queuedDelayed: Number(row.queued_delayed || 0),
      processing: Number(row.processing || 0),
      done: Number(row.done || 0),
      failed: Number(row.failed || 0),
      done24h: Number(row.done_24h || 0),
      failed24h: Number(row.failed_24h || 0)
    },
    timing: {
      oldestQueuedAt: row.oldest_queued_at || null,
      oldestQueuedAgeSeconds: Number(row.oldest_queued_age_seconds || 0),
      nextRetryAt: row.next_retry_at || null,
      oldestProcessingAt: row.oldest_processing_at || null,
      oldestProcessingAgeSeconds: Number(row.oldest_processing_age_seconds || 0)
    }
  };
}
