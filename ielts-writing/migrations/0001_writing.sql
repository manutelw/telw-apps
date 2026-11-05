-- Dedicated Writing D1 database only. Never apply to the Reading or Listening databases.
PRAGMA foreign_keys=ON;
CREATE TABLE writing_learners(id TEXT PRIMARY KEY,email_hash TEXT NOT NULL UNIQUE,email TEXT NOT NULL,verified_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE writing_email_challenges(id TEXT PRIMARY KEY,email_hash TEXT NOT NULL,email TEXT,code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,consumed_at INTEGER,created_at INTEGER NOT NULL);
CREATE INDEX writing_challenge_email ON writing_email_challenges(email_hash,created_at);
CREATE TABLE writing_sessions(token_hash TEXT PRIMARY KEY,learner_id TEXT NOT NULL REFERENCES writing_learners(id),created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,revoked_at INTEGER);
CREATE TABLE writing_auth_limits(bucket_key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE writing_attempts(
 id TEXT PRIMARY KEY,
 learner_id TEXT NOT NULL REFERENCES writing_learners(id),
 set_id TEXT NOT NULL,
 started_at INTEGER NOT NULL,
 deadline_at INTEGER NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('active','submitted','marked')),
 answer1 TEXT NOT NULL DEFAULT '',
 answer2 TEXT NOT NULL DEFAULT '',
 save_seq INTEGER NOT NULL DEFAULT 0,
 saved_at INTEGER,
 submitted_at INTEGER,
 mark_lease INTEGER,
 mark_tries INTEGER NOT NULL DEFAULT 0,
 result_json TEXT,
 marked_at INTEGER,
 feedback_emailed_at INTEGER,
 trainer_test INTEGER NOT NULL DEFAULT 0 CHECK(trainer_test IN (0,1))
);
CREATE UNIQUE INDEX writing_one_open ON writing_attempts(learner_id) WHERE status IN ('active','submitted');
CREATE INDEX writing_attempts_started ON writing_attempts(started_at);
-- Answers cannot change after submission. A result cannot change once issued.
CREATE TRIGGER writing_answers_locked BEFORE UPDATE OF answer1,answer2 ON writing_attempts WHEN OLD.status!='active'
BEGIN SELECT RAISE(ABORT,'WRITING_ANSWERS_LOCKED'); END;
CREATE TRIGGER writing_result_immutable BEFORE UPDATE OF result_json,status ON writing_attempts WHEN OLD.status='marked'
BEGIN SELECT RAISE(ABORT,'WRITING_RESULT_IMMUTABLE'); END;
-- Private settings such as the marking rubric. Never returned to learners.
CREATE TABLE writing_config(key TEXT PRIMARY KEY,value TEXT NOT NULL);
