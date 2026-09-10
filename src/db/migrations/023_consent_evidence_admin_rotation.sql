ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS credential_binding TEXT;

UPDATE admin_sessions
SET revoked_at = COALESCE(revoked_at, NOW())
WHERE credential_binding IS NULL AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS legal_document_revisions (
  revision_id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  configuration JSONB NOT NULL,
  content JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
