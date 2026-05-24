ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS report_email_status TEXT NOT NULL DEFAULT 'not_sent';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS report_email_sent_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS report_email_last_attempt_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS report_email_error TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS report_email_provider_id TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS report_email_attempts INTEGER NOT NULL DEFAULT 0;

UPDATE sessions
SET
  report_email_status = 'sent',
  report_email_sent_at = COALESCE(report_email_sent_at, analysis_completed_at, updated_at),
  report_email_last_attempt_at = COALESCE(report_email_last_attempt_at, analysis_completed_at, updated_at),
  report_email_attempts = CASE
    WHEN report_email_attempts = 0 THEN 1
    ELSE report_email_attempts
  END
WHERE payment_status = 'paid'
  AND analysis_status = 'done'
  AND analysis_result IS NOT NULL
  AND LENGTH(TRIM(analysis_result)) > 0
  AND report_email_status = 'not_sent'
  AND created_at < TIMESTAMPTZ '2026-05-24 00:00:00+00';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'report_email_status_check'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT report_email_status_check
      CHECK (report_email_status IN ('not_sent', 'sending', 'sent', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_report_email_status
  ON sessions(report_email_status);

CREATE INDEX IF NOT EXISTS idx_sessions_report_email_sent_at
  ON sessions(report_email_sent_at);
