ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS public_access_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS checkout_attempt INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_redaction_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_public_access_token_hash
  ON sessions(public_access_token_hash)
  WHERE public_access_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  session_token_hash TEXT UNIQUE NOT NULL,
  csrf_token_hash TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_active
  ON admin_sessions(expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_reset_at
  ON api_rate_limits(reset_at);

ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS payload_redacted_at TIMESTAMPTZ;
