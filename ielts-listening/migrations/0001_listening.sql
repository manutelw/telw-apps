-- Dedicated Listening D1 database only. Never apply to Reading's database.
PRAGMA foreign_keys=ON;
CREATE TABLE listening_learners(id TEXT PRIMARY KEY,email_hash TEXT NOT NULL UNIQUE,email TEXT NOT NULL,verified_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE listening_email_challenges(id TEXT PRIMARY KEY,email_hash TEXT NOT NULL,email TEXT,code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,consumed_at INTEGER,created_at INTEGER NOT NULL);
CREATE INDEX listening_challenge_email ON listening_email_challenges(email_hash,created_at);
CREATE TABLE listening_sessions(token_hash TEXT PRIMARY KEY,learner_id TEXT NOT NULL REFERENCES listening_learners(id),created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,revoked_at INTEGER);
CREATE TABLE listening_auth_limits(bucket_key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE listening_sets(id TEXT PRIMARY KEY,title TEXT NOT NULL,public_json TEXT NOT NULL,private_json TEXT NOT NULL,review_json TEXT,published_at INTEGER,created_at INTEGER NOT NULL);
CREATE TABLE listening_audio(set_id TEXT NOT NULL REFERENCES listening_sets(id),part INTEGER NOT NULL CHECK(part BETWEEN 1 AND 4),object_key TEXT NOT NULL UNIQUE,sha256 TEXT NOT NULL,duration REAL NOT NULL CHECK(duration>0),size INTEGER NOT NULL,PRIMARY KEY(set_id,part));
CREATE TABLE listening_attempts(id TEXT PRIMARY KEY,learner_id TEXT NOT NULL REFERENCES listening_learners(id),set_id TEXT NOT NULL REFERENCES listening_sets(id),started_at INTEGER NOT NULL,deadline INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','abandoned')),answers_revision INTEGER NOT NULL DEFAULT 0,answers_json TEXT NOT NULL DEFAULT '{}',playback_json TEXT NOT NULL,score_json TEXT,completed_at INTEGER);
CREATE UNIQUE INDEX listening_one_active ON listening_attempts(learner_id) WHERE status='active';
CREATE TRIGGER listening_cooldown BEFORE INSERT ON listening_attempts WHEN EXISTS(SELECT 1 FROM listening_attempts WHERE learner_id=NEW.learner_id AND completed_at>NEW.started_at-1296000) BEGIN SELECT RAISE(ABORT,'LISTENING_COOLDOWN'); END;
CREATE TRIGGER listening_assignment_immutable BEFORE UPDATE ON listening_attempts WHEN NEW.id!=OLD.id OR NEW.learner_id!=OLD.learner_id OR NEW.set_id!=OLD.set_id OR NEW.started_at!=OLD.started_at OR NEW.deadline!=OLD.deadline BEGIN SELECT RAISE(ABORT,'LISTENING_ASSIGNMENT_IMMUTABLE'); END;
CREATE TRIGGER listening_result_immutable BEFORE UPDATE ON listening_attempts WHEN OLD.status='completed' BEGIN SELECT RAISE(ABORT,'LISTENING_RESULT_IMMUTABLE'); END;
CREATE TRIGGER listening_set_immutable BEFORE UPDATE ON listening_sets WHEN OLD.published_at IS NOT NULL BEGIN SELECT RAISE(ABORT,'LISTENING_SET_IMMUTABLE'); END;
CREATE TRIGGER listening_audio_immutable BEFORE UPDATE ON listening_audio WHEN EXISTS(SELECT 1 FROM listening_sets WHERE id=OLD.set_id AND published_at IS NOT NULL) BEGIN SELECT RAISE(ABORT,'LISTENING_AUDIO_IMMUTABLE'); END;
CREATE TABLE listening_delivery(id TEXT PRIMARY KEY,attempt_id TEXT NOT NULL REFERENCES listening_attempts(id),kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,payload_json TEXT NOT NULL,UNIQUE(attempt_id,kind));
