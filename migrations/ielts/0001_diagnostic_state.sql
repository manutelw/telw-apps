-- Cloudflare D1: private IELTS diagnostic state (not public assets).
CREATE TABLE IF NOT EXISTS ielts_learners (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  verified_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ielts_email_challenges (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ielts_challenge_email ON ielts_email_challenges(email_hash, created_at);
CREATE TABLE IF NOT EXISTS ielts_test_versions (
  id TEXT PRIMARY KEY,
  skill TEXT NOT NULL CHECK(skill IN ('reading','listening','writing','speaking')),
  track TEXT NOT NULL CHECK(track IN ('academic','general')),
  approved_at INTEGER,
  content_json TEXT NOT NULL,
  private_key_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ielts_attempts (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES ielts_learners(id),
  skill TEXT NOT NULL CHECK(skill IN ('reading','listening','writing','speaking')),
  track TEXT NOT NULL CHECK(track IN ('academic','general')),
  version_id TEXT NOT NULL REFERENCES ielts_test_versions(id),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  response_json TEXT,
  score_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_ielts_attempt_eligibility ON ielts_attempts(learner_id,skill,completed_at);
CREATE INDEX IF NOT EXISTS idx_ielts_attempt_version ON ielts_attempts(version_id);
CREATE TABLE IF NOT EXISTS ielts_email_delivery (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES ielts_learners(id),
  attempt_id TEXT NOT NULL REFERENCES ielts_attempts(id),
  kind TEXT NOT NULL CHECK(kind IN ('candidate_feedback','trainer_report')),
  sent_at INTEGER NOT NULL,
  UNIQUE(attempt_id,kind)
);
