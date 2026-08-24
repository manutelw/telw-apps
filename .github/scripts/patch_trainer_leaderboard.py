from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# The dashboard and Excel already consume the same backend weeklyBulkMetrics.
# The dashboard was blank because its student batch had been derived as
# "2026-28 PGDM" while the institution batch selector uses "2026-28".
# Normalize only for leaderboard matching so both surfaces rank the same rows.
old = '''          const batch = isPrivate ? "Private learners" : (student.batch || "No batch");
          if (batch !== batchName) return null;'''
new = '''          const canonicalBatch = value => String(value || "")
            .replace(/\\s+PGDM\\s*$/i, "")
            .trim();
          const batch = isPrivate ? "Private learners" : canonicalBatch(student.batch || "No batch");
          const targetBatch = isPrivate ? "Private learners" : canonicalBatch(batchName);
          if (batch !== targetBatch) return null;'''

if old not in text and new not in text:
    raise SystemExit("Dashboard leaderboard batch-match block was not found")
if old in text:
    text = text.replace(old,new,1)

text, _ = re.subn(
    r'data-ascent-build="[^"]+"',
    'data-ascent-build="2026-08-24.17"',
    text,
    count=1,
)

checks = {
    "shared_metric": "reportData.weeklyBulkMetrics" in text and "workbookData.weeklyBulkMetrics" in text,
    "normalized_batch": "const targetBatch = isPrivate ? \"Private learners\" : canonicalBatch(batchName);" in text,
    "build": 'data-ascent-build="2026-08-24.17"' in text,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: " + ", ".join(failed))

if text != original:
    path.write_text(text,encoding="utf-8")
    print("trainer.html patched: dashboard and Excel now share normalized leaderboard data")
else:
    print("trainer.html already has normalized shared leaderboard data")
