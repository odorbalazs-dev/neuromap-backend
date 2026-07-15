CREATE TABLE IF NOT EXISTS consent_events (
  id UUID PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  language VARCHAR(10) NOT NULL,
  actor_role TEXT NOT NULL CHECK (
    actor_role IN ('parent_or_legal_guardian', 'adult_authorized_purchaser')
  ),
  adult_confirmation BOOLEAN NOT NULL,
  guardian_authority BOOLEAN NOT NULL,
  terms_acknowledged BOOLEAN NOT NULL,
  informational_purpose_acknowledged BOOLEAN NOT NULL,
  digital_performance_requested BOOLEAN NOT NULL,
  withdrawal_right_acknowledged BOOLEAN NOT NULL,
  privacy_notice_acknowledged BOOLEAN NOT NULL,
  special_category_explicit_consent BOOLEAN NOT NULL,
  ai_transparency_acknowledged BOOLEAN NOT NULL,
  analytics_consent BOOLEAN NOT NULL DEFAULT FALSE,
  advertising_consent BOOLEAN NOT NULL DEFAULT FALSE CHECK (advertising_consent = FALSE),
  privacy_policy_version TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  consent_policy_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS consent_event_id UUID REFERENCES consent_events(id);

CREATE INDEX IF NOT EXISTS idx_consent_events_expires_at
  ON consent_events(expires_at)
  WHERE used_at IS NULL AND withdrawn_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_consent_events_consented_at
  ON consent_events(consented_at);

CREATE INDEX IF NOT EXISTS idx_sessions_consent_event_id
  ON sessions(consent_event_id);
