CREATE INDEX IF NOT EXISTS idx_analysis_jobs_queue_claim
ON analysis_jobs (status, created_at, id)
WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_processing_lock
ON analysis_jobs (locked_at, id)
WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_done_processed_at
ON analysis_jobs (processed_at DESC)
WHERE status = 'done';

CREATE INDEX IF NOT EXISTS idx_sessions_paid_analysis_status
ON sessions (payment_status, analysis_status, paid_at, created_at);
