-- Preserve published versions and their candidate history while replacing
-- their allocation with a corrected, independently published version.
CREATE TABLE listening_set_replacements(
 old_set_id TEXT PRIMARY KEY REFERENCES listening_sets(id),
 new_set_id TEXT NOT NULL UNIQUE REFERENCES listening_sets(id),
 created_at INTEGER NOT NULL,
 CHECK(old_set_id!=new_set_id)
);
