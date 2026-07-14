ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS processing_token UUID,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_webhook_events_processing_started_at
  ON webhook_events(status, processing_started_at);
