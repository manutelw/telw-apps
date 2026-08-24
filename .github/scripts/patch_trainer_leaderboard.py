from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# Dashboard: current score uses only Bulk Questions whose grace week has ended.
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
        "Top 10 by Bulk Questions Average. A question released on Monday enters the denominator from the following Monday; unanswered eligible questions count as 0.";

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
          ? `<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">#</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Student</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Eligible</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Answered</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Bulk Avg</th></tr></thead><tbody>${ranked.map((entry,index) => `<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${index+1}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.fullName)}<br><span class="form-note">${escapeHtml(entry.studentId)}</span></td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:center;">${entry.released}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:center;">${entry.answered}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">${entry.average.toFixed(2)}</td></tr>`).join("")}</tbody></table>`
          : `<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No eligible Bulk Questions yet</div>`;
        return `<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">${escapeHtml(batchName)}</div>${body}</div>`;
      }).join("");
    }

    async function loadReport'''
text, dashboard_count = leaderboard_pattern.subn(leaderboard_replacement, text, count=1)

# Excel: historical weekly leaderboard blocks plus a separate weekly submitter sheet.
excel_pattern = re.compile(
    r"    function buildWeeklyLeaderboardSheets\(workbookData\) \{.*?^    \}\n\n    function workbookProgressSummary",
    re.MULTILINE | re.DOTALL,
)
excel_replacement = '''    function buildWeeklyLeaderboardSheets(workbookData) {
      const students = Array.isArray(workbookData.students) ? workbookData.students : [];
      const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""),student]));
      const weeklyMetrics = Array.isArray(workbookData.weeklyBulkMetrics) ? workbookData.weeklyBulkMetrics : [];
      const weeklySubmitters = Array.isArray(workbookData.weeklyBulkSubmitters) ? workbookData.weeklyBulkSubmitters : [];
      const palette = ["DDEBF7","E2F0D9","FFF2CC","FCE4D6","E4DFEC","DDEBF7"];
      const output = [];

      function fmtDate(value) {
        if (!value) return "";
        const d = new Date(String(value) + "T00:00:00");
        return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
      }
      function applyFill(sheet, range, rgb) {
        for (let r=range.s.r; r<=range.e.r; r+=1) {
          for (let c=range.s.c; c<=range.e.c; c+=1) {
            const addr = XLSX.utils.encode_cell({r,c});
            if (!sheet[addr]) sheet[addr] = {t:"s",v:""};
            sheet[addr].s = Object.assign({},sheet[addr].s || {},{fill:{patternType:"solid",fgColor:{rgb}}});
          }
        }
      }

      const batchNames = Array.from(new Set(students.map(student => exportText(student.batch)).filter(Boolean))).sort().reverse();
      const weekNos = Array.from(new Set(weeklyMetrics.map(metric => Number(metric.weekNo)).filter(Number.isFinite))).sort((a,b) => a-b);

      batchNames.forEach(batchName => {
        const blockWidth = 6;
        const gap = 1;
        const rows = [[],[]];
        for (let r=2; r<12; r+=1) rows.push([]);
        const merges = [];
        const fills = [];

        weekNos.forEach((weekNo,weekIndex) => {
          const startCol = weekIndex * (blockWidth + gap);
          const weekRows = weeklyMetrics.filter(metric => {
            if (Number(metric.weekNo) !== weekNo) return false;
            const student = studentByUuid.get(String(metric.studentUuid || ""));
            return student && exportText(student.batch) === batchName;
          });
          const sample = weekRows[0];
          const title = `Week ${weekNo} · ${sample ? fmtDate(sample.weekStart) : ""} – ${sample ? fmtDate(sample.weekEnd) : ""}`;
          rows[0][startCol] = title;
          merges.push({s:{r:0,c:startCol},e:{r:0,c:startCol+blockWidth-1}});
          ["Rank","Name","Roll No","Eligible Bulk Qs","Answered","Average"].forEach((value,i) => rows[1][startCol+i]=value);

          const ranked = weekRows.map(metric => {
            const student = studentByUuid.get(String(metric.studentUuid || ""));
            return {
              name:student ? exportText(student.name || student.fullName) : "",
              rollNo:student ? exportText(student.rollNo || student.studentId) : "",
              released:Number(metric.released || 0),
              answered:Number(metric.answered || 0),
              average:Number(metric.average || 0)
            };
          }).filter(entry => entry.released > 0)
            .sort((a,b) => b.average-a.average || b.answered-a.answered || a.name.localeCompare(b.name))
            .slice(0,10);

          for (let rank=0; rank<10; rank+=1) {
            const entry = ranked[rank];
            const row = rows[rank+2];
            row[startCol] = rank+1;
            row[startCol+1] = entry ? entry.name : "";
            row[startCol+2] = entry ? entry.rollNo : "";
            row[startCol+3] = entry ? entry.released : "";
            row[startCol+4] = entry ? entry.answered : "";
            row[startCol+5] = entry ? Number(entry.average.toFixed(2)) : "";
          }
          fills.push({range:{s:{r:0,c:startCol},e:{r:1,c:startCol+blockWidth-1}},rgb:palette[weekIndex % palette.length]});
        });

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!merges"] = merges;
        const cols = [];
        weekNos.forEach(() => cols.push({wch:8},{wch:27},{wch:18},{wch:18},{wch:12},{wch:12},{wch:3}));
        sheet["!cols"] = cols;
        fills.forEach(item => applyFill(sheet,item.range,item.rgb));
        output.push({batchName,sheet});
      });

      // Separate weekly submitter list. One coloured block per week.
      if (weeklySubmitters.length) {
        const submitterWeeks = Array.from(new Set(weeklySubmitters.map(item => String(item.weekStart || "")))).filter(Boolean).sort();
        const grouped = submitterWeeks.map(weekStart => weeklySubmitters.filter(item => String(item.weekStart || "")===weekStart));
        const maxRows = Math.max(...grouped.map(items => items.length),0);
        const rows = [[],[]];
        for (let r=0; r<maxRows; r+=1) rows.push([]);
        const merges = [];
        const fills = [];
        const blockWidth = 4;
        const gap = 1;

        grouped.forEach((items,weekIndex) => {
          const startCol = weekIndex*(blockWidth+gap);
          const sample = items[0];
          rows[0][startCol] = `Week ${weekIndex+1} · ${sample ? fmtDate(sample.weekStart) : ""} – ${sample ? fmtDate(sample.weekEnd) : ""}`;
          merges.push({s:{r:0,c:startCol},e:{r:0,c:startCol+blockWidth-1}});
          ["Batch","Name","Roll No","Responses Submitted"].forEach((value,i)=>rows[1][startCol+i]=value);
          const entries = items.map(item => {
            const student = studentByUuid.get(String(item.studentUuid || ""));
            return {
              batch:student ? exportText(student.batch) : "",
              name:student ? exportText(student.name || student.fullName) : "",
              rollNo:student ? exportText(student.rollNo || student.studentId) : "",
              count:Number(item.submissionCount || 0)
            };
          }).filter(entry => entry.name).sort((a,b) => a.batch.localeCompare(b.batch) || a.name.localeCompare(b.name));
          entries.forEach((entry,index) => {
            const row = rows[index+2];
            row[startCol]=entry.batch;
            row[startCol+1]=entry.name;
            row[startCol+2]=entry.rollNo;
            row[startCol+3]=entry.count;
          });
          fills.push({range:{s:{r:0,c:startCol},e:{r:1,c:startCol+blockWidth-1}},rgb:palette[weekIndex % palette.length]});
        });

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!merges"] = merges;
        const cols=[];
        grouped.forEach(()=>cols.push({wch:14},{wch:28},{wch:18},{wch:20},{wch:3}));
        sheet["!cols"] = cols;
        fills.forEach(item=>applyFill(sheet,item.range,item.rgb));
        output.push({batchName:"WEEKLY SUBMITTERS",sheet});
      }

      return output;
    }

    function workbookProgressSummary'''
text, excel_count = excel_pattern.subn(excel_replacement, text, count=1)

# Individual performance retains the same grace-period current average from bulkMetrics.
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
text, _ = re.subn(r'data-ascent-build="[^"]+"','data-ascent-build="2026-08-24.12"',text,count=1)

checks = {
    "dashboard": dashboard_count or 'following Monday' in text,
    "excel": excel_count or 'weeklyBulkMetrics' in text,
    "submitters": 'weeklyBulkSubmitters' in text and 'WEEKLY SUBMITTERS' in text,
    "build": 'data-ascent-build="2026-08-24.12"' in text,
}
failed = [name for name,ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: " + ", ".join(failed))

if text != original:
    path.write_text(text,encoding="utf-8")
    print("trainer.html patched with weekly grace leaderboards and submitter lists")
else:
    print("trainer.html already contains weekly grace leaderboards and submitter lists")
