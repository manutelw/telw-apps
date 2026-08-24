from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# 1) Keep the latest-populated-week fallback already required by the dashboard.
pattern = re.compile(
    r"    function currentWeekBounds\(.*?^    \}",
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
        String(row.questionType || "").toUpperCase() === "BULK" &&
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
text, _ = pattern.subn(replacement, text, count=1)

# 2) Dashboard leaderboard: average BULK questions only; Diagnostic and other types are excluded.
leaderboard_pattern = re.compile(
    r"    function renderWeeklyLeaderboard\(\) \{.*?^    \}\n\n    async function loadReport",
    re.MULTILINE | re.DOTALL,
)
leaderboard_replacement = '''    function renderWeeklyLeaderboard() {
      const bulkRows = filteredDashboardResults().filter(row =>
        String(row.questionType || "").toUpperCase() === "BULK"
      );
      const {start,end} = currentWeekBounds(bulkRows);
      byId("leaderboardWeekLabel").textContent = `Top 10 by average Bulk Questions score, ${start.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${new Date(end.getTime()-86400000).toLocaleDateString(undefined,{month:"short",day:"numeric"})}. Diagnostic and other question types are excluded.`;

      const active = selectedDashboardAccessPoint();
      const isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
      const selectedBatch = byId("dashboardBatchFilter").value;

      const batchNames = isPrivate
        ? ["Private learners"]
        : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || []).slice().sort());

      const wrap = byId("weeklyLeaderboard");
      if (!batchNames.length) { wrap.innerHTML = `<div class="line-empty">No batches set up yet for this selection.</div>`; return; }

      const rows = bulkRows.filter(row => {
        if (row.latestScore === null || row.latestScore === undefined) return false;
        if (!row.latestSubmittedAt) return false;
        const submitted = new Date(row.latestSubmittedAt);
        return submitted >= start && submitted < end;
      });

      const byBatch = new Map();
      rows.forEach(row => {
        const batchKey = isPrivate ? "Private learners" : (row.batch || "No batch");
        if (!byBatch.has(batchKey)) byBatch.set(batchKey,new Map());
        const byStudent = byBatch.get(batchKey);
        const key = row.studentUuid;
        if (!byStudent.has(key)) byStudent.set(key,{fullName:row.fullName,studentId:row.studentId,scores:[]});
        byStudent.get(key).scores.push(Number(row.latestScore));
      });

      wrap.innerHTML = batchNames.map(batchName => {
        const studentMap = byBatch.get(batchName);
        const ranked = studentMap ? Array.from(studentMap.values())
          .map(entry => ({fullName:entry.fullName,studentId:entry.studentId,attempts:entry.scores.length,average:entry.scores.reduce((a,b) => a+b,0) / entry.scores.length}))
          .sort((a,b) => b.average - a.average || b.attempts - a.attempts || String(a.fullName).localeCompare(String(b.fullName)))
          .slice(0,10) : [];

        const body = ranked.length
          ? `<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">#</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Student</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Bulk Qs</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Bulk Avg</th></tr></thead><tbody>${ranked.map((entry,index) => `<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${index+1}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.fullName)}<br><span class="form-note">${escapeHtml(entry.studentId)}</span></td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:center;">${entry.attempts}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">${entry.average.toFixed(2)}</td></tr>`).join("")}</tbody></table>`
          : `<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No Bulk Question submissions yet</div>`;

        return `<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">${escapeHtml(batchName)}</div>${body}</div>`;
      }).join("");
    }

    async function loadReport'''
text, leaderboard_count = leaderboard_pattern.subn(leaderboard_replacement, text, count=1)

# 3) Excel leaderboard: use BULK submissions only.
old_source = '''      ).filter(assignment => Boolean(assignment.submissionUuid) && assignment.submittedAt);'''
new_source = '''      ).filter(assignment =>
        Boolean(assignment.submissionUuid) &&
        assignment.submittedAt &&
        String(assignment.questionType || "").toUpperCase() === "BULK"
      );'''
if old_source in text:
    text = text.replace(old_source, new_source, 1)

text = text.replace(
    "// ranked by their average score across that week's submissions.",
    "// ranked by their average score across that week's BULK-question submissions."
)
text = text.replace('subHeaderRow.push("Name","Score");','subHeaderRow.push("Name","Bulk Avg");')

# 4) Individual student performance: replace mixed average with type-specific averages.
old_headers = '''      const snapshotHeaders = [
        "Questions Released",
        "Questions Answered",
        "Completion",
        "Average Score",
        "Latest Score",
        "Score Trend"
      ];'''
new_headers = '''      const snapshotHeaders = [
        "Questions Released",
        "Questions Answered",
        "Completion",
        "Diagnostic Average",
        "Bulk Questions Average",
        "Latest Score",
        "Score Trend"
      ];'''
if old_headers in text:
    text = text.replace(old_headers,new_headers,1)

old_average = '''        const latest = scoredAssignments.length ? scoredAssignments[scoredAssignments.length - 1] : null;
        const average = scoredAssignments.length
          ? scoredAssignments.reduce((sum,item) => sum + item.score,0) / scoredAssignments.length
          : null;'''
new_average = '''        const latest = scoredAssignments.length ? scoredAssignments[scoredAssignments.length - 1] : null;
        const diagnosticScores = scoredAssignments
          .filter(item => String(item.assignment.questionType || "").toUpperCase() === "DIAGNOSTIC")
          .map(item => item.score);
        const bulkScores = scoredAssignments
          .filter(item => String(item.assignment.questionType || "").toUpperCase() === "BULK")
          .map(item => item.score);
        const diagnosticAverage = diagnosticScores.length
          ? diagnosticScores.reduce((sum,score) => sum + score,0) / diagnosticScores.length
          : null;
        const bulkAverage = bulkScores.length
          ? bulkScores.reduce((sum,score) => sum + score,0) / bulkScores.length
          : null;'''
if old_average in text:
    text = text.replace(old_average,new_average,1)

old_row = '''          "Completion":workbookCompletionBar(answeredAssignments.length,releasedAssignments.length),
          "Average Score":average === null ? "" : Number(average.toFixed(2)),
          "Latest Score":latest ? latest.score : "",
          "Score Trend":workbookScoreTrend(scoredAssignments.map(item => item.score))'''
new_row = '''          "Completion":workbookCompletionBar(answeredAssignments.length,releasedAssignments.length),
          "Diagnostic Average":diagnosticAverage === null ? "" : Number(diagnosticAverage.toFixed(2)),
          "Bulk Questions Average":bulkAverage === null ? "" : Number(bulkAverage.toFixed(2)),
          "Latest Score":latest ? latest.score : "",
          "Score Trend":workbookScoreTrend(scoredAssignments.map(item => item.score))'''
if old_row in text:
    text = text.replace(old_row,new_row,1)

text = text.replace(
    '[15,24,30,17,14,14,22,13,13,16,...questionHeaders.map(() => 8),68]',
    '[15,24,30,17,14,14,22,16,18,13,16,...questionHeaders.map(() => 8),68]',
    1
)

old_center = '''            snapshotStart + 3,
            snapshotStart + 4,
            snapshotStart + 5,'''
new_center = '''            snapshotStart + 3,
            snapshotStart + 4,
            snapshotStart + 5,
            snapshotStart + 6,'''
if old_center in text:
    text = text.replace(old_center,new_center,1)

old_scores = '''          scoreColumns:[
            snapshotStart + 3,
            snapshotStart + 4,
            ...questionHeaders.map((_,index) => questionStart + index)
          ],
          emphasisScoreColumns:[snapshotStart + 3,snapshotStart + 4],'''
new_scores = '''          scoreColumns:[
            snapshotStart + 3,
            snapshotStart + 4,
            snapshotStart + 5,
            ...questionHeaders.map((_,index) => questionStart + index)
          ],
          emphasisScoreColumns:[snapshotStart + 3,snapshotStart + 4],'''
if old_scores in text:
    text = text.replace(old_scores,new_scores,1)

# 5) Build marker.
text, build_count = re.subn(
    r'data-ascent-build="[^"]+"',
    'data-ascent-build="2026-08-24.9"',
    text,
    count=1,
)

checks = {
    "bulk_dashboard": leaderboard_count or 'Top 10 by average Bulk Questions score' in text,
    "bulk_excel": 'String(assignment.questionType || "").toUpperCase() === "BULK"' in text,
    "diagnostic_average": '"Diagnostic Average"' in text,
    "bulk_average": '"Bulk Questions Average"' in text,
    "build_marker": build_count or 'data-ascent-build="2026-08-24.9"' in text,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: " + ", ".join(failed))

if text != original:
    path.write_text(text, encoding="utf-8")
    print("trainer.html patched with question-type averages")
else:
    print("trainer.html already contains question-type average patch")
