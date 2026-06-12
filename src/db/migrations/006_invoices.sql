CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  provider TEXT NOT NULL DEFAULT 'szamlazzhu',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'issued', 'failed', 'skipped')),

  provider_invoice_id TEXT,
  invoice_number TEXT,
  invoice_url TEXT,

  currency TEXT,
  gross_amount NUMERIC(12, 2),
  vat_rate TEXT,

  billing_name TEXT,
  billing_email TEXT,
  billing_country TEXT,
  billing_zip TEXT,
  billing_city TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  tax_id TEXT,

  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  error_message TEXT,
  provider_response JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (session_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_invoices_session_id
  ON invoices(session_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices(status);

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS invoice_status TEXT NOT NULL DEFAULT 'not_started';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS invoice_id UUID;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS invoice_error TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sessions_invoice_status
  ON sessions(invoice_status);
