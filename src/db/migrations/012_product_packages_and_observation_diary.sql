ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS package_code TEXT NOT NULL DEFAULT 'legacy_500_v1',
  ADD COLUMN IF NOT EXISTS offer_version TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS amount_total INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_package_created_at
  ON sessions(package_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_paid_package
  ON sessions(package_code, paid_at DESC)
  WHERE payment_status = 'paid';

CREATE TABLE IF NOT EXISTS observation_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  focus_domain TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observation_programs_status_end
  ON observation_programs(status, ends_at);

CREATE TABLE IF NOT EXISTS observation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES observation_programs(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  context TEXT NOT NULL DEFAULT 'other'
    CHECK (context IN ('morning', 'learning', 'social', 'transition', 'evening', 'other')),
  signal_level SMALLINT NOT NULL CHECK (signal_level BETWEEN 0 AND 3),
  strategy_used BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_observation_entries_program_date
  ON observation_entries(program_id, entry_date DESC);

CREATE TABLE IF NOT EXISTS observation_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES observation_programs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('day_1', 'day_7', 'day_14')),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_observation_follow_ups_due
  ON observation_follow_ups(status, due_at)
  WHERE status IN ('pending', 'failed');

CREATE TABLE IF NOT EXISTS observation_trend_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL UNIQUE REFERENCES observation_programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'sent', 'failed')),
  summary JSONB,
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
