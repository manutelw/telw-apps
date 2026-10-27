-- Apply after 0001. No changes to other applications' tables.
ALTER TABLE ielts_email_challenges ADD COLUMN email TEXT;
CREATE TABLE ielts_sessions (
  token_hash TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES ielts_learners(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX idx_ielts_session_learner ON ielts_sessions(learner_id);
CREATE INDEX idx_ielts_session_expiry ON ielts_sessions(expires_at);
CREATE TABLE ielts_auth_limits (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_ielts_auth_limit_expiry ON ielts_auth_limits(expires_at);
