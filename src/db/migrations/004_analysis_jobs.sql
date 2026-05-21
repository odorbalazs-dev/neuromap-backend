CREATE TABLE IF NOT EXISTS analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  session_id UUID NOT NULL
    REFERENCES sessions(id)
    ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (
      status IN (
        'queued',
        'processing',
        'done',
        'failed'
      )
    ),

  attempts INTEGER NOT NULL DEFAULT 0,

  locked_at TIMESTAMP NULL,
  locked_by TEXT NULL,

  last_error TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status
ON analysis_jobs(status);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_session
ON analysis_jobs(session_id);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created
ON analysis_jobs(created_at);