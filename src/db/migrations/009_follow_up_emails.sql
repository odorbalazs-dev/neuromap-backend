ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS follow_up_email_status TEXT NOT NULL DEFAULT 'not_due';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS follow_up_email_due_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS follow_up_email_sent_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS follow_up_email_last_attempt_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS follow_up_email_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS follow_up_email_error TEXT;

UPDATE sessions
SET follow_up_email_due_at = COALESCE(report_email_sent_at, analysis_completed_at, paid_at, created_at) + INTERVAL '3 days'
WHERE follow_up_email_due_at IS NULL
  AND report_email_status = 'sent';

CREATE INDEX IF NOT EXISTS idx_sessions_follow_up_email_status_due
  ON sessions (follow_up_email_status, follow_up_email_due_at);
