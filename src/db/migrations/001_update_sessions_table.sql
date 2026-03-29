ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS analysis_result TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE sessions
SET analysis_result = result_text
WHERE analysis_result IS NULL
  AND result_text IS NOT NULL;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_status_check'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT payment_status_check
      CHECK (payment_status IN ('pending', 'paid', 'failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'analysis_status_check'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT analysis_status_check
      CHECK (analysis_status IN ('pending', 'processing', 'done', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_email
  ON sessions(email);

CREATE INDEX IF NOT EXISTS idx_sessions_payment_status
  ON sessions(payment_status);

CREATE INDEX IF NOT EXISTS idx_sessions_analysis_status
  ON sessions(analysis_status);

CREATE INDEX IF NOT EXISTS idx_sessions_stripe_session_id
  ON sessions(stripe_session_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'uq_sessions_stripe_session_id'
  ) THEN
    CREATE UNIQUE INDEX uq_sessions_stripe_session_id
      ON sessions(stripe_session_id)
      WHERE stripe_session_id IS NOT NULL;
  END IF;
END $$;