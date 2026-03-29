CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider
  ON webhook_events(provider);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
  ON webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON webhook_events(status);