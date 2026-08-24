from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# 1) Dashboard: use current week when populated; otherwise latest populated week.
pattern = re.compile(
    r"    function currentWeekBounds\(\) \{.*?^    \}",
    re.MULTILINE | re.DOTALL,
)
replacement = '''    function currentWeekBounds(rows=null) {
      const now = new Date();
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      let start = new Date(now.getFullYear(),now.getMonth(),now.getDate() + mondayOffset);
      start.setHours(0,0,0,0);
      let end = new Date(start);
      end.setDate(end.getDate() + 7);

      const source = Array.isArray(rows) ? rows.filter(row =>
        row && row.latestSubmittedAt && row.latestScore !== null && row.latestScore !== undefined &&
        !Number.isNaN(new Date(row.latestSubmittedAt).getTime())
      ) : [];

      const hasCurrentWeek = source.some(row => {
        const submitted = new Date(row.latestSubmittedAt);
        return submitted >= start && submitted < end;
      });

      if (!hasCurrentWeek && source.length) {
        const latestTime = Math.max(...source.map(row => new Date(row.latestSubmittedAt).getTime()));
        const latest = new Date(latestTime);
        const latestDay = latest.getDay();
        const latestMondayOffset = latestDay === 0 ? -6 : 1 - latestDay;
        start = new Date(latest.getFullYear(),latest.getMonth(),latest.getDate() + latestMondayOffset);
        start.setHours(0,0,0,0);
        end = new Date(start);
        end.setDate(end.getDate() + 7);
      }
      return {start,end};
    }'''
text, bounds_count = pattern.subn(replacement, text, count=1)

text, call_count = re.subn(
    r"const \{start,end\} = currentWeekBounds\(\);",
    "const {start,end} = currentWeekBounds(filteredDashboardResults());",
    text,
    count=1,
)

# 2) Excel: prefer actual submissions as leaderboard source.
old_excel = '''      const assignments = (Array.isArray(workbookData.assignments) ? workbookData.assignments : [])
        .filter(assignment => Boolean(assignment.submissionUuid) && assignment.submittedAt);'''
new_excel = '''      const assignments = (
        Array.isArray(workbookData.submissions) && workbookData.submissions.length
          ? workbookData.submissions
          : (Array.isArray(workbookData.assignments) ? workbookData.assignments : [])
      ).filter(assignment => Boolean(assignment.submissionUuid) && assignment.submittedAt);'''
excel_count = 0
if old_excel in text:
    text = text.replace(old_excel, new_excel, 1)
    excel_count = 1
elif "Array.isArray(workbookData.submissions) && workbookData.submissions.length" in text:
    excel_count = 1

# 3) Excel: show newest batch first (2026-28 before 2025-27).
old_sort = "return Array.from(byBatch.keys()).sort().map(batchName => {"
new_sort = "return Array.from(byBatch.keys()).sort().reverse().map(batchName => {"
sort_count = 0
if old_sort in text:
    text = text.replace(old_sort, new_sort, 1)
    sort_count = 1
elif new_sort in text:
    sort_count = 1

# 4) Build marker for verification.
text, build_count = re.subn(
    r'data-ascent-build="[^"]+"',
    'data-ascent-build="2026-08-24.7"',
    text,
    count=1,
)

checks = {
    "week_function": bounds_count or "function currentWeekBounds(rows=null)" in text,
    "week_call": call_count or "currentWeekBounds(filteredDashboardResults())" in text,
    "excel_source": excel_count,
    "batch_order": sort_count,
    "build_marker": build_count or 'data-ascent-build="2026-08-24.7"' in text,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: " + ", ".join(failed))

if text != original:
    path.write_text(text, encoding="utf-8")
    print("trainer.html patched successfully")
else:
    print("trainer.html already contains leaderboard patch")
