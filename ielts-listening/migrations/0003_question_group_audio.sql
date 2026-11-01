CREATE TABLE listening_groups(
 set_id TEXT NOT NULL REFERENCES listening_sets(id),
 part INTEGER NOT NULL CHECK(part BETWEEN 1 AND 4),
 group_no INTEGER NOT NULL,
 from_q INTEGER NOT NULL,
 to_q INTEGER NOT NULL,
 object_key TEXT NOT NULL UNIQUE,
 duration REAL NOT NULL CHECK(duration>0),
 size INTEGER NOT NULL CHECK(size>0),
 sha256 TEXT NOT NULL,
 reading_seconds INTEGER NOT NULL CHECK(reading_seconds>0),
 read_cue TEXT NOT NULL,
 listen_cue TEXT NOT NULL,
 read_cue_seconds REAL NOT NULL,
 listen_cue_seconds REAL NOT NULL,
 PRIMARY KEY(set_id,part,group_no)
);
-- A recorded technical failure can permit a fresh attempt without altering
-- the original immutable result or weakening the normal 15-day rule.
CREATE TABLE listening_timing_relief(
 attempt_id TEXT PRIMARY KEY REFERENCES listening_attempts(id),
 reason TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
DROP TRIGGER listening_cooldown;
CREATE TRIGGER listening_cooldown BEFORE INSERT ON listening_attempts
WHEN EXISTS(SELECT 1 FROM listening_attempts a
 WHERE a.learner_id=NEW.learner_id AND a.completed_at>NEW.started_at-1296000
 AND NOT EXISTS(SELECT 1 FROM listening_timing_relief r WHERE r.attempt_id=a.id))
BEGIN SELECT RAISE(ABORT,'LISTENING_COOLDOWN'); END;
