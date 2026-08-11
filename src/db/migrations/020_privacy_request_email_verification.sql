ALTER TABLE privacy_requests
  DROP CONSTRAINT IF EXISTS privacy_requests_status_check;

ALTER TABLE privacy_requests
  ADD CONSTRAINT privacy_requests_status_check
  CHECK (status IN (
    'received',
    'verification_pending',
    'processing',
    'identity_verified',
    'in_review',
    'fulfilled',
    'partially_fulfilled',
    'rejected',
    'cancelled'
  ));

ALTER TABLE privacy_requests
  ADD COLUMN IF NOT EXISTS verification_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_channel TEXT;

CREATE INDEX IF NOT EXISTS idx_privacy_requests_verification_pending
  ON privacy_requests(verification_expires_at)
  WHERE status = 'verification_pending';
