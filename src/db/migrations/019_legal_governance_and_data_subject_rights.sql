ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS processing_restricted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_restriction_reason TEXT,
  ADD COLUMN IF NOT EXISTS sensitive_data_erased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_confirmation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS contract_confirmation_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_confirmation_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_confirmation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_confirmation_provider_id TEXT,
  ADD COLUMN IF NOT EXISTS contract_confirmation_error TEXT;

ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_contract_confirmation_status_check;

-- The feature is prospective. Existing paid sessions are treated as already
-- confirmed so deploying this migration cannot trigger retroactive bulk email.
UPDATE sessions
SET contract_confirmation_status = 'sent',
    contract_confirmation_sent_at = COALESCE(paid_at, updated_at, created_at)
WHERE payment_status = 'paid'
  AND contract_confirmation_status = 'pending';

ALTER TABLE sessions
  ADD CONSTRAINT sessions_contract_confirmation_status_check
  CHECK (contract_confirmation_status IN ('pending', 'sending', 'sent', 'failed'));

ALTER TABLE consent_events
  ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_source TEXT;

ALTER TABLE analysis_jobs
  DROP CONSTRAINT IF EXISTS analysis_jobs_status_check;

ALTER TABLE analysis_jobs
  ADD CONSTRAINT analysis_jobs_status_check
  CHECK (status IN ('queued', 'processing', 'done', 'failed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_sessions_processing_restriction
  ON sessions(processing_restricted_at)
  WHERE processing_restricted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_retention_due
  ON sessions(retention_delete_at)
  WHERE sensitive_data_erased_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_contract_confirmation_retry
  ON sessions(contract_confirmation_status, contract_confirmation_last_attempt_at)
  WHERE payment_status = 'paid'
    AND contract_confirmation_status <> 'sent';

CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL
    CHECK (request_type IN (
      'access',
      'portability',
      'erasure',
      'restriction',
      'rectification',
      'objection',
      'consent_withdrawal'
    )),
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN (
      'received',
      'identity_verified',
      'in_review',
      'fulfilled',
      'partially_fulfilled',
      'rejected',
      'cancelled'
    )),
  requester_email_hash TEXT,
  request_token_hash TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_reason TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  identity_verified_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_status_due
  ON privacy_requests(status, due_at);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_session
  ON privacy_requests(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS privacy_request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES privacy_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'system',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_request_events_request
  ON privacy_request_events(request_id, created_at);
