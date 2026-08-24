from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# The INCOMPLETE RESPONSES sheet must use the latest completed week's
# cumulative Bulk metric. This keeps Responses due aligned with the
# leaderboard denominator (e.g. end of Week 2 = Q1 + Q2 = 2 due).
needle = '''      const incompleteRows=[["Students who have NOT submitted all Bulk Questions due through the latest completed week"],["Batch","Roll number","Name","Responses submitted","Responses due","Missing"]];
      const incompleteEntries=currentBulkMetrics.map(metric=>{'''
replacement = '''      const latestCompletedWeekNo = weekNos.length ? weekNos[weekNos.length - 1] : null;
      const latestCompletedMetrics = latestCompletedWeekNo === null
        ? []
        : weeklyMetrics.filter(metric => Number(metric.weekNo) === latestCompletedWeekNo);
      const incompleteRows=[["Students who have NOT submitted all Bulk Questions due through the latest completed week"],["Batch","Roll number","Name","Responses submitted","Responses due","Missing"]];
      const incompleteEntries=latestCompletedMetrics.map(metric=>{'''

if needle not in text:
    # Idempotent pass if the correction is already present.
    if "const incompleteEntries=latestCompletedMetrics.map(metric=>{" not in text:
        raise SystemExit("Could not find INCOMPLETE RESPONSES metric source")
else:
    text = text.replace(needle, replacement, 1)

text = re.sub(r'data-ascent-build="[^"]+"', 'data-ascent-build="2026-08-24.18"', text, count=1)

checks = [
    "const incompleteEntries=latestCompletedMetrics.map(metric=>{" in text,
    "latestCompletedWeekNo" in text,
    'data-ascent-build="2026-08-24.18"' in text,
]
if not all(checks):
    raise SystemExit("Incomplete-response due-count patch verification failed")

if text != original:
    path.write_text(text, encoding="utf-8")
    print("trainer.html patched: INCOMPLETE RESPONSES uses latest completed week denominator")
else:
    print("trainer.html already has corrected INCOMPLETE RESPONSES denominator")
