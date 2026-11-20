-- Schema of the live telw-ielts-preview D1 database (read 20 Nov 2026), with the trainer
-- exempted from the Reading cooldown trigger. Reference only; the live database already has these tables.
CREATE TABLE ielts_learners (id TEXT PRIMARY KEY, email_hash TEXT NOT NULL UNIQUE, email TEXT NOT NULL, verified_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE ielts_sessions (token_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES ielts_learners(id), created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER);
CREATE TABLE ielts_auth_limits (bucket_key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE ielts_email_challenges (id TEXT PRIMARY KEY, email_hash TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, consumed_at INTEGER, created_at INTEGER NOT NULL, email TEXT);
CREATE TABLE ielts_test_versions (id TEXT PRIMARY KEY, skill TEXT NOT NULL CHECK(skill IN ('reading','listening','writing','speaking')), track TEXT NOT NULL CHECK(track IN ('academic','general')), approved_at INTEGER, content_json TEXT NOT NULL, private_key_json TEXT, created_at INTEGER NOT NULL);
CREATE TABLE ielts_attempts (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES ielts_learners(id), skill TEXT NOT NULL CHECK(skill IN ('reading','listening','writing','speaking')), track TEXT NOT NULL CHECK(track IN ('academic','general')), version_id TEXT NOT NULL REFERENCES ielts_test_versions(id), started_at INTEGER NOT NULL, completed_at INTEGER, response_json TEXT, score_json TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','abandoned')), deadline INTEGER);
CREATE TABLE ielts_email_delivery (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES ielts_learners(id), attempt_id TEXT NOT NULL REFERENCES ielts_attempts(id), kind TEXT NOT NULL CHECK(kind IN ('candidate_feedback','trainer_report')), sent_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('pending','sending','sent')), created_at INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0, payload_json TEXT, UNIQUE(attempt_id, kind));
CREATE UNIQUE INDEX idx_ielts_one_active ON ielts_attempts(learner_id, skill) WHERE status = 'active';
CREATE TRIGGER ielts_completed_attempt_immutable BEFORE UPDATE ON ielts_attempts WHEN OLD.status = 'completed' BEGIN SELECT RAISE(ABORT, 'IELTS_COMPLETED_ATTEMPT_IMMUTABLE'); END;
CREATE TRIGGER ielts_reading_cooldown BEFORE INSERT ON ielts_attempts WHEN NEW.skill = 'reading'
  AND NOT EXISTS (SELECT 1 FROM ielts_learners WHERE id = NEW.learner_id AND lower(email) = 'manutelw@gmail.com')
  AND EXISTS (SELECT 1 FROM ielts_attempts WHERE learner_id = NEW.learner_id AND skill = 'reading' AND completed_at > NEW.started_at - 1296000)
BEGIN SELECT RAISE(ABORT, 'IELTS_READING_COOLDOWN'); END;
