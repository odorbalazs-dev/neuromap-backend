import os from "os";
import { db } from "../db/db.js";

const WORKER_ID =
  `${os.hostname()}-${process.pid}`;

export async function enqueueAnalysisJob(sessionId) {
  const result = await db.query(
    `
    INSERT INTO analysis_jobs (
      session_id,
      status
    )
    VALUES ($1, 'queued')
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
    FROM analysis_jobs
    WHERE session_id = $1
      AND status IN ('queued', 'processing')
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
      attempts = attempts + 1,
      updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM analysis_jobs
      WHERE status = 'queued'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
    `,
    [WORKER_ID]
  );

  return result.rows[0] || null;
}

export async function markAnalysisJobDone(jobId) {
  await db.query(
    `
    UPDATE analysis_jobs
    SET
      status = 'done',
      processed_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
    `,
    [jobId]
  );
}

export async function markAnalysisJobFailed(
  jobId,
  errorMessage
) {
  await db.query(
    `
    UPDATE analysis_jobs
    SET
      status = 'failed',
      last_error = $2,
      updated_at = NOW()
    WHERE id = $1
    `,
    [jobId, errorMessage]
  );
}

export async function requeueStaleJobs({
  staleMinutes = 15
} = {}) {
  const result = await db.query(
    `
    UPDATE analysis_jobs
    SET
      status = 'queued',
      locked_at = NULL,
      locked_by = NULL,
      updated_at = NOW()
    WHERE status = 'processing'
      AND locked_at < NOW() - ($1::int * INTERVAL '1 minute')
    RETURNING id
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
        COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
        COUNT(*) FILTER (WHERE status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
        COUNT(*) FILTER (
          WHERE status = 'done'
            AND processed_at >= NOW() - INTERVAL '24 hours'
        )::int AS done_24h,
        MIN(created_at) FILTER (WHERE status = 'queued') AS oldest_queued_at,
        MIN(locked_at) FILTER (WHERE status = 'processing') AS oldest_processing_at
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
      processing: Number(row.processing || 0),
      done: Number(row.done || 0),
      failed: Number(row.failed || 0),
      done24h: Number(row.done_24h || 0)
    },
    timing: {
      oldestQueuedAt: row.oldest_queued_at || null,
      oldestQueuedAgeSeconds: Number(row.oldest_queued_age_seconds || 0),
      oldestProcessingAt: row.oldest_processing_at || null,
      oldestProcessingAgeSeconds: Number(row.oldest_processing_age_seconds || 0)
    }
  };
}
