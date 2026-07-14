ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS processing_token UUID,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invoices_processing_started_at
  ON invoices(status, processing_started_at);
