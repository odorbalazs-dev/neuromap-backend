ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS checkout_request_hash text,
  ADD COLUMN IF NOT EXISTS financial_status text NOT NULL DEFAULT 'clear',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS report_email_delivery_status text,
  ADD COLUMN IF NOT EXISTS report_email_delivery_at timestamptz;

CREATE TABLE IF NOT EXISTS payment_attempts (
  stripe_session_id text PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  attempt integer NOT NULL,
  livemode boolean NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'complete', 'expired')),
  payment_intent_id text,
  expires_at timestamptz,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payment_attempts_session_idx ON payment_attempts(session_id);
CREATE INDEX IF NOT EXISTS payment_attempts_reconcile_idx ON payment_attempts(checked_at NULLS FIRST);
INSERT INTO payment_attempts(stripe_session_id, session_id, attempt, livemode, status)
SELECT stripe_session_id, id, GREATEST(COALESCE(checkout_attempt,1),1),
  LEFT(stripe_session_id,8) = 'cs_live_', CASE WHEN payment_status='paid' THEN 'complete' ELSE 'open' END
FROM sessions WHERE stripe_session_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS payment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  provider_event_id text NOT NULL UNIQUE,
  reason text NOT NULL,
  amount integer,
  currency text,
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','resolved')),
  resolution text,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS payment_adjustments (
  provider_id text PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id),
  kind text NOT NULL CHECK (kind IN ('refund','dispute')),
  status text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS submission_started_at timestamptz;
CREATE TABLE IF NOT EXISTS email_delivery_events (
  event_id text PRIMARY KEY,
  provider_id text NOT NULL,
  type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_delivery_provider_idx ON email_delivery_events(provider_id);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS last_recovery_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS payment_reconciliation_cursors (
  livemode boolean PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT NOW() - INTERVAL '28 days',
  window_end timestamptz NOT NULL DEFAULT NOW(),
  starting_after text,
  lease_token uuid,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
