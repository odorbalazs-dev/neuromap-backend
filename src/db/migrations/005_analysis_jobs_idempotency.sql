WITH ranked_active_jobs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY session_id
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM analysis_jobs
  WHERE status IN ('queued', 'processing')
)
UPDATE analysis_jobs
SET
  status = 'failed',
  last_error = 'Superseded duplicate active analysis job during idempotency migration.',
  updated_at = NOW()
WHERE id IN (
  SELECT id
  FROM ranked_active_jobs
  WHERE row_num > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS analysis_jobs_one_active_per_session_idx
ON analysis_jobs (session_id)
WHERE status IN ('queued', 'processing');
