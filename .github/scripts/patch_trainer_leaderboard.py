from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# Dashboard: use backend completion-adjusted bulk metrics.
leaderboard_pattern = re.compile(
    r"    function renderWeeklyLeaderboard\(\) \{.*?^    \}\n\n    async function loadReport",
    re.MULTILINE | re.DOTALL,
)
leaderboard_replacement = '''    function renderWeeklyLeaderboard() {
      const active = selectedDashboardAccessPoint();
      const isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
      const selectedBatch = byId("dashboardBatchFilter").value;
      const students = Array.isArray(reportData.students) ? reportData.students : [];
      const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""),student]));
      const metrics = Array.isArray(reportData.bulkMetrics) ? reportData.bulkMetrics : [];

      byId("leaderboardWeekLabel").textContent =
        "Top 10 by Bulk Questions Average. Unanswered released Bulk Questions count as 0. Average = total Bulk score ÷ Bulk Questions released.";

      const batchNames = isPrivate
        ? ["Private learners"]
        : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || []).slice().sort());
      const wrap = byId("weeklyLeaderboard");
      if (!batchNames.length) {
        wrap.innerHTML = `<div class="line-empty">No batches set up yet for this selection.</div>`;
        return;
      }

      const byBatch = new Map();
      metrics.forEach(metric => {
        const released = Number(metric.released || 0);
        const answered = Number(metric.answered || 0);
        const average = metric.average === null || metric.average === undefined ? null : Number(metric.average);
        if (released <= 0 || !Number.isFinite(average)) return;
        const student = studentByUuid.get(String(metric.studentUuid || ""));
        if (!student) return;
        const batchKey = isPrivate ? "Private learners" : (student.batch || "No batch");
        if (selectedBatch && !isPrivate && batchKey !== selectedBatch) return;
        if (!byBatch.has(batchKey)) byBatch.set(batchKey,[]);
        byBatch.get(batchKey).push({
          fullName:student.fullName || student.name || "",
          studentId:student.studentId || student.rollNo || "",
          released,
          answered,
          average
        });
      });

      wrap.innerHTML = batchNames.map(batchName => {
        const ranked = (byBatch.get(batchName) || [])
          .sort((a,b) => b.average - a.average || b.answered - a.answered || String(a.fullName).localeCompare(String(b.fullName)))
          .slice(0,10);
        const body = ranked.length
          ? `<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">#</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Student</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Released</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Answered</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Bulk Avg</th></tr></thead><tbody>${ranked.map((entry,index) => `<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${index+1}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.fullName)}<br><span class="form-note">${escapeHtml(entry.studentId)}</span></td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:center;">${entry.released}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:center;">${entry.answered}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">${entry.average.toFixed(2)}</td></tr>`).join("")}</tbody></table>`
          : `<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No released Bulk Questions yet</div>`;
        return `<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">${escapeHtml(batchName)}</div>${body}</div>`;
      }).join("");
    }

    async function loadReport'''
text, dashboard_count = leaderboard_pattern.subn(leaderboard_replacement, text, count=1)

# Excel leaderboard: same backend metric and denominator.
excel_pattern = re.compile(
    r"    function buildWeeklyLeaderboardSheets\(workbookData\) \{.*?^    \}\n\n    function workbookProgressSummary",
    re.MULTILINE | re.DOTALL,
)
excel_replacement = '''    function buildWeeklyLeaderboardSheets(workbookData) {
      const students = Array.isArray(workbookData.students) ? workbookData.students : [];
      const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""),student]));
      const metrics = Array.isArray(workbookData.bulkMetrics) ? workbookData.bulkMetrics : [];
      const byBatch = new Map();

      metrics.forEach(metric => {
        const released = Number(metric.released || 0);
        const answered = Number(metric.answered || 0);
        const average = metric.average === null || metric.average === undefined ? null : Number(metric.average);
        if (released <= 0 || !Number.isFinite(average)) return;
        const student = studentByUuid.get(String(metric.studentUuid || ""));
        if (!student) return;
        const batchName = exportText(student.batch) || "No batch";
        if (!byBatch.has(batchName)) byBatch.set(batchName,[]);
        byBatch.get(batchName).push({
          name:exportText(student.name || student.fullName),
          rollNo:exportText(student.rollNo || student.studentId),
          released,
          answered,
          average
        });
      });

      return Array.from(byBatch.keys()).sort().reverse().map(batchName => {
        const ranked = byBatch.get(batchName)
          .sort((a,b) => b.average - a.average || b.answered - a.answered || a.name.localeCompare(b.name))
          .slice(0,10);
        const rows = [["Rank","Name","Roll No","Bulk Questions Released","Bulk Questions Answered","Bulk Questions Average"]];
        for (let index=0; index<10; index+=1) {
          const entry = ranked[index];
          rows.push([
            index + 1,
            entry ? entry.name : "",
            entry ? entry.rollNo : "",
            entry ? entry.released : "",
            entry ? entry.answered : "",
            entry ? Number(entry.average.toFixed(2)) : ""
          ]);
        }
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!cols"] = [{wch:8},{wch:28},{wch:18},{wch:23},{wch:24},{wch:24}];
        return {batchName,sheet};
      });
    }

    function workbookProgressSummary'''
text, excel_count = excel_pattern.subn(excel_replacement, text, count=1)

# Individual student performance: make Bulk Questions Average use the same completion-adjusted metric.
function_pattern = re.compile(
    r"(    function buildIndividualPerformanceSheet\(workbookData, questions, questionNumberByTask\) \{.*?)(^    function buildDetailedResultsSheet)",
    re.MULTILINE | re.DOTALL,
)
match = function_pattern.search(text)
if match:
    block = match.group(1)
    if "bulkMetricByStudent" not in block:
        marker = "      const assignments = Array.isArray(workbookData.assignments) ? workbookData.assignments : [];"
        insertion = marker + "\n      const bulkMetricByStudent = new Map((Array.isArray(workbookData.bulkMetrics) ? workbookData.bulkMetrics : []).map(metric => [String(metric.studentUuid || \"\"),metric]));"
        block = block.replace(marker,insertion,1)
    block = re.sub(
        r"        const bulkAverage = bulkScores\.length\n          \? bulkScores\.reduce\(\(sum,score\) => sum \+ score,0\) / bulkScores\.length\n          : null;",
        '        const bulkMetric = bulkMetricByStudent.get(studentKey);\n        const bulkAverage = bulkMetric && bulkMetric.average !== null && bulkMetric.average !== undefined\n          ? Number(bulkMetric.average)\n          : null;',
        block,
        count=1,
    )
    text = text[:match.start()] + block + match.group(2) + text[match.end():]

text = text.replace('<h3>Weekly Leaderboard</h3>','<h3>Bulk Questions Leaderboard</h3>',1)
text, _ = re.subn(r'data-ascent-build="[^"]+"','data-ascent-build="2026-08-24.11"',text,count=1)

checks = {
    "dashboard": dashboard_count or 'Unanswered released Bulk Questions count as 0' in text,
    "excel": excel_count or 'Bulk Questions Released' in text,
    "metrics": 'workbookData.bulkMetrics' in text and 'reportData.bulkMetrics' in text,
    "build": 'data-ascent-build="2026-08-24.11"' in text,
}
failed = [name for name,ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: " + ", ".join(failed))

if text != original:
    path.write_text(text,encoding="utf-8")
    print("trainer.html patched with zero-for-unanswered bulk averaging")
else:
    print("trainer.html already contains zero-for-unanswered bulk averaging")
