ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS pdf_status text NOT NULL DEFAULT 'pending'
    CHECK (pdf_status IN ('pending', 'generating', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS pdf_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_error_code text,
  ADD COLUMN IF NOT EXISTS pdf_bytes integer,
  ADD COLUMN IF NOT EXISTS pdf_sha256 text;

-- A successfully submitted attachment is evidence of historical PDF generation.
UPDATE sessions SET pdf_status = 'ready', pdf_completed_at = report_email_sent_at
WHERE report_email_status = 'sent' AND pdf_status = 'pending';

CREATE TABLE IF NOT EXISTS post_payment_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  task text NOT NULL CHECK (task IN ('contract_confirmation', 'invoice')),
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  locked_until timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(session_id, task)
);
CREATE INDEX IF NOT EXISTS post_payment_outbox_due_idx
  ON post_payment_outbox(available_at) WHERE status IN ('pending', 'processing');

CREATE TABLE IF NOT EXISTS operational_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL,
  source text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  summary jsonb NOT NULL DEFAULT '{}',
  error_code text
);
CREATE INDEX IF NOT EXISTS operational_runs_task_started_idx ON operational_runs(task, started_at DESC);
CREATE TABLE IF NOT EXISTS operational_schedule (
  task text PRIMARY KEY,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  locked_until timestamptz
);
