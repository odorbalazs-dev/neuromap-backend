ALTER TABLE analysis_jobs
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP NULL;

UPDATE analysis_jobs
SET next_attempt_at = COALESCE(next_attempt_at, created_at)
WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_queue_retry_claim
ON analysis_jobs (status, next_attempt_at, created_at, id)
WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_failed_at
ON analysis_jobs (failed_at DESC)
WHERE status = 'failed';
