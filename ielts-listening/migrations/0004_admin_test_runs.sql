-- Trainer test runs do not consume a learner diagnostic allowance.
ALTER TABLE listening_attempts ADD COLUMN admin_test INTEGER NOT NULL DEFAULT 0 CHECK(admin_test IN (0,1));
DROP TRIGGER listening_cooldown;
CREATE TRIGGER listening_cooldown BEFORE INSERT ON listening_attempts
WHEN NEW.admin_test=0 AND EXISTS(SELECT 1 FROM listening_attempts a
 WHERE a.learner_id=NEW.learner_id AND a.admin_test=0 AND a.completed_at>NEW.started_at-1296000
 AND NOT EXISTS(SELECT 1 FROM listening_timing_relief r WHERE r.attempt_id=a.id))
BEGIN SELECT RAISE(ABORT,'LISTENING_COOLDOWN'); END;
CREATE TRIGGER listening_admin_test_identity BEFORE INSERT ON listening_attempts
WHEN NEW.admin_test=1 AND NOT EXISTS(SELECT 1 FROM listening_learners l WHERE l.id=NEW.learner_id AND l.email='manutelw@gmail.com' AND l.verified_at>0)
BEGIN SELECT RAISE(ABORT,'LISTENING_TRAINER_REQUIRED'); END;
CREATE TRIGGER listening_admin_test_immutable BEFORE UPDATE ON listening_attempts
WHEN NEW.admin_test!=OLD.admin_test
BEGIN SELECT RAISE(ABORT,'LISTENING_ADMIN_MODE_IMMUTABLE'); END;
