from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# Dashboard: rank by cumulative Bulk Questions Average across all scored bulk questions.
leaderboard_pattern = re.compile(
    r"    function renderWeeklyLeaderboard\(\) \{.*?^    \}\n\n    async function loadReport",
    re.MULTILINE | re.DOTALL,
)
leaderboard_replacement = '''    function renderWeeklyLeaderboard() {
      const bulkRows = filteredDashboardResults().filter(row =>
        String(row.questionType || "").toUpperCase() === "BULK" &&
        row.latestScore !== null && row.latestScore !== undefined
      );

      byId("leaderboardWeekLabel").textContent =
        "Top 10 by cumulative Bulk Questions Average. Diagnostic and other question types are excluded.";

      const active = selectedDashboardAccessPoint();
      const isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
      const selectedBatch = byId("dashboardBatchFilter").value;

      const batchNames = isPrivate
        ? ["Private learners"]
        : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || []).slice().sort());

      const wrap = byId("weeklyLeaderboard");
      if (!batchNames.length) {
        wrap.innerHTML = `<div class="line-empty">No batches set up yet for this selection.</div>`;
        return;
      }

      const byBatch = new Map();
      bulkRows.forEach(row => {
        const score = Number(row.latestScore);
        if (!Number.isFinite(score)) return;
        const batchKey = isPrivate ? "Private learners" : (row.batch || "No batch");
        if (!byBatch.has(batchKey)) byBatch.set(batchKey,new Map());
        const byStudent = byBatch.get(batchKey);
        const key = String(row.studentUuid || row.studentId || row.fullName || "");
        if (!key) return;
        if (!byStudent.has(key)) {
          byStudent.set(key,{fullName:row.fullName,studentId:row.studentId,scores:[]});
        }
        byStudent.get(key).scores.push(score);
      });

      wrap.innerHTML = batchNames.map(batchName => {
        const studentMap = byBatch.get(batchName);
        const ranked = studentMap ? Array.from(studentMap.values())
          .map(entry => ({
            fullName:entry.fullName,
            studentId:entry.studentId,
            attempts:entry.scores.length,
            average:entry.scores.reduce((sum,score) => sum + score,0) / entry.scores.length
          }))
          .sort((a,b) =>
            b.average - a.average ||
            b.attempts - a.attempts ||
            String(a.fullName).localeCompare(String(b.fullName))
          )
          .slice(0,10) : [];

        const body = ranked.length
          ? `<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">#</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Student</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Bulk Qs</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Bulk Questions Average</th></tr></thead><tbody>${ranked.map((entry,index) => `<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${index+1}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.fullName)}<br><span class="form-note">${escapeHtml(entry.studentId)}</span></td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:center;">${entry.attempts}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">${entry.average.toFixed(2)}</td></tr>`).join("")}</tbody></table>`
          : `<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No Bulk Question submissions yet</div>`;

        return `<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">${escapeHtml(batchName)}</div>${body}</div>`;
      }).join("");
    }

    async function loadReport'''
text, dashboard_count = leaderboard_pattern.subn(leaderboard_replacement, text, count=1)

# Rename dashboard card from weekly to the metric actually used.
text = text.replace(
    '<h3>Weekly Leaderboard</h3>',
    '<h3>Bulk Questions Leaderboard</h3>',
    1
)

# Excel: one cumulative leaderboard per batch, using the same Bulk Questions Average.
excel_pattern = re.compile(
    r"    function buildWeeklyLeaderboardSheets\(workbookData\) \{.*?^    \}\n\n    function workbookProgressSummary",
    re.MULTILINE | re.DOTALL,
)
excel_replacement = '''    function buildWeeklyLeaderboardSheets(workbookData) {
      const submissions = (
        Array.isArray(workbookData.submissions) && workbookData.submissions.length
          ? workbookData.submissions
          : (Array.isArray(workbookData.assignments) ? workbookData.assignments : [])
      ).filter(item =>
        Boolean(item.submissionUuid) &&
        String(item.questionType || "").toUpperCase() === "BULK" &&
        exportNumber(item.score ?? item.finalScore ?? item.totalScore) !== null
      );

      const byBatch = new Map();
      submissions.forEach(item => {
        const batchName = exportText(item.batch) || "No batch";
        if (!byBatch.has(batchName)) byBatch.set(batchName,new Map());
        const students = byBatch.get(batchName);
        const studentKey = String(item.studentUuid || item.rollNo || item.name || "");
        if (!studentKey) return;
        if (!students.has(studentKey)) {
          students.set(studentKey,{
            name:exportText(item.name),
            rollNo:exportText(item.rollNo),
            scores:[]
          });
        }
        students.get(studentKey).scores.push(
          Number(exportNumber(item.score ?? item.finalScore ?? item.totalScore))
        );
      });

      return Array.from(byBatch.keys()).sort().reverse().map(batchName => {
        const ranked = Array.from(byBatch.get(batchName).values())
          .map(student => ({
            name:student.name,
            rollNo:student.rollNo,
            attempts:student.scores.length,
            average:student.scores.reduce((sum,score) => sum + score,0) / student.scores.length
          }))
          .sort((a,b) =>
            b.average - a.average ||
            b.attempts - a.attempts ||
            a.name.localeCompare(b.name)
          )
          .slice(0,10);

        const rows = [
          ["Rank","Name","Roll No","Bulk Questions Attempted","Bulk Questions Average"]
        ];
        for (let index=0; index<10; index+=1) {
          const entry = ranked[index];
          rows.push([
            index + 1,
            entry ? entry.name : "",
            entry ? entry.rollNo : "",
            entry ? entry.attempts : "",
            entry ? Number(entry.average.toFixed(2)) : ""
          ]);
        }

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!cols"] = [
          {wch:8},{wch:28},{wch:18},{wch:24},{wch:24}
        ];
        return {batchName,sheet};
      });
    }

    function workbookProgressSummary'''
text, excel_count = excel_pattern.subn(excel_replacement, text, count=1)

# Build marker.
text, build_count = re.subn(
    r'data-ascent-build="[^"]+"',
    'data-ascent-build="2026-08-24.10"',
    text,
    count=1,
)

checks = {
    "dashboard": dashboard_count or 'cumulative Bulk Questions Average' in text,
    "excel": excel_count or 'Bulk Questions Attempted' in text,
    "heading": 'Bulk Questions Leaderboard' in text,
    "build": build_count or 'data-ascent-build="2026-08-24.10"' in text,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: " + ", ".join(failed))

if text != original:
    path.write_text(text, encoding="utf-8")
    print("trainer.html patched to rank by cumulative bulk averages")
else:
    print("trainer.html already uses cumulative bulk averages")
