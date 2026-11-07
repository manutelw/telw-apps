-- An attempt whose marking failed on every try (5) no longer counts as open, so the learner
-- can start a replacement test. The failed attempt and its answers are kept.
DROP INDEX IF EXISTS writing_one_open;
CREATE UNIQUE INDEX writing_one_open ON writing_attempts(learner_id) WHERE status='active' OR (status='submitted' AND mark_tries<5);
