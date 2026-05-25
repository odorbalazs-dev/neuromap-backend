ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS checkout_started_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS checkout_cancelled_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS checkout_url TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS recovery_token TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sessions_checkout_started_at
  ON sessions(checkout_started_at);

CREATE INDEX IF NOT EXISTS idx_sessions_recovery_email_sent_at
  ON sessions(recovery_email_sent_at);
