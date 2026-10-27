ALTER TABLE ielts_attempts ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','abandoned'));
ALTER TABLE ielts_attempts ADD COLUMN deadline INTEGER;
UPDATE ielts_attempts SET status='completed' WHERE completed_at IS NOT NULL;
UPDATE ielts_attempts SET deadline=started_at+3600 WHERE skill='reading';
CREATE UNIQUE INDEX idx_ielts_one_active ON ielts_attempts(learner_id,skill) WHERE status='active';
CREATE TRIGGER ielts_reading_cooldown BEFORE INSERT ON ielts_attempts
WHEN NEW.skill='reading' AND EXISTS(SELECT 1 FROM ielts_attempts WHERE learner_id=NEW.learner_id AND skill='reading' AND completed_at>NEW.started_at-1296000)
BEGIN SELECT RAISE(ABORT,'IELTS_READING_COOLDOWN'); END;
CREATE TRIGGER ielts_completed_attempt_immutable BEFORE UPDATE ON ielts_attempts
WHEN OLD.status='completed'
BEGIN SELECT RAISE(ABORT,'IELTS_COMPLETED_ATTEMPT_IMMUTABLE'); END;
CREATE TRIGGER ielts_attempt_assignment_immutable BEFORE UPDATE ON ielts_attempts
WHEN NEW.id!=OLD.id OR NEW.learner_id!=OLD.learner_id OR NEW.skill!=OLD.skill OR NEW.track!=OLD.track OR NEW.version_id!=OLD.version_id OR NEW.started_at!=OLD.started_at OR NEW.deadline IS NOT OLD.deadline
BEGIN SELECT RAISE(ABORT,'IELTS_ATTEMPT_ASSIGNMENT_IMMUTABLE'); END;
CREATE TRIGGER ielts_approved_version_immutable BEFORE UPDATE ON ielts_test_versions
WHEN OLD.approved_at IS NOT NULL
BEGIN SELECT RAISE(ABORT,'IELTS_APPROVED_VERSION_IMMUTABLE'); END;
ALTER TABLE ielts_email_delivery ADD COLUMN status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('pending','sending','sent'));
ALTER TABLE ielts_email_delivery ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ielts_email_delivery ADD COLUMN lease_until INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ielts_email_delivery ADD COLUMN payload_json TEXT;
