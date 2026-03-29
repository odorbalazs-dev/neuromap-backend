CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT NOT NULL,
  name TEXT NOT NULL,
  lang TEXT NOT NULL,

  stripe_session_id TEXT UNIQUE,

  payment_status TEXT NOT NULL DEFAULT 'pending',
  analysis_status TEXT NOT NULL DEFAULT 'pending',

  payload JSONB NOT NULL,

  analysis_result TEXT,
  error_message TEXT,

  paid_at TIMESTAMPTZ,
  analysis_started_at TIMESTAMPTZ,
  analysis_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexek
CREATE INDEX IF NOT EXISTS idx_sessions_email
  ON sessions(email);

CREATE INDEX IF NOT EXISTS idx_sessions_payment_status
  ON sessions(payment_status);

CREATE INDEX IF NOT EXISTS idx_sessions_analysis_status
  ON sessions(analysis_status);

CREATE INDEX IF NOT EXISTS idx_sessions_stripe_session_id
  ON sessions(stripe_session_id);

-- Status constraint-ek (védelem typo ellen)
ALTER TABLE sessions
  ADD CONSTRAINT payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed'));

ALTER TABLE sessions
  ADD CONSTRAINT analysis_status_check
  CHECK (analysis_status IN ('pending', 'processing', 'done', 'failed'));