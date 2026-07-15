ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS consent_record JSONB,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_delete_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_redacted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sessions_retention_delete_at
  ON sessions(retention_delete_at)
  WHERE data_redacted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_consented_at
  ON sessions(consented_at);
