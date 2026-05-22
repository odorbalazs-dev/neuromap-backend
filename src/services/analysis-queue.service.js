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
