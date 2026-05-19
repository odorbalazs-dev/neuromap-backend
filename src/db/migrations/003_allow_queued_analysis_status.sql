ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS analysis_status_check;

ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_analysis_status_check;

ALTER TABLE sessions
ADD CONSTRAINT analysis_status_check
CHECK (analysis_status IN ('pending', 'queued', 'processing', 'done', 'failed'));