DROP TABLE IF EXISTS webhook_events;

CREATE TABLE webhook_events (
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

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_webhook_events_provider'
  ) THEN
    CREATE INDEX idx_webhook_events_provider
      ON webhook_events(provider);
  END IF;
END $;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_webhook_events_event_type'
  ) THEN
    CREATE INDEX idx_webhook_events_event_type
      ON webhook_events(event_type);
  END IF;
END $;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_webhook_events_status'
  ) THEN
    CREATE INDEX idx_webhook_events_status
      ON webhook_events(status);
  END IF;
END $;