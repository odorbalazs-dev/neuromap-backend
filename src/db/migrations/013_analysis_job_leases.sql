ALTER TABLE analysis_jobs
  ADD COLUMN IF NOT EXISTS lease_token UUID,
  ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ;

UPDATE analysis_jobs
SET heartbeat_at = COALESCE(heartbeat_at, locked_at)
WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_processing_heartbeat
ON analysis_jobs (heartbeat_at, id)
WHERE status = 'processing';
