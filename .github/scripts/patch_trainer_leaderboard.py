from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# Dashboard: latest completed week, but rank on each student's cumulative
# Bulk average through that week. This is the same average logic used by
# Individual Student Performance: unanswered due Bulk Questions count as 0.
dashboard_pattern = re.compile(
    r"    function renderWeeklyLeaderboard\(\) \{.*?^    \}\n\n    async function loadReport",
    re.MULTILINE | re.DOTALL,
)
dashboard_replacement = r'''    function renderWeeklyLeaderboard() {
      const active = selectedDashboardAccessPoint();
      const isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
      const selectedBatch = byId("dashboardBatchFilter").value;
      const students = Array.isArray(reportData.students) ? reportData.students : [];
      const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""),student]));
      const metrics = Array.isArray(reportData.weeklyBulkMetrics) ? reportData.weeklyBulkMetrics : [];
      const weekNos = Array.from(new Set(metrics.map(metric => Number(metric.weekNo)).filter(Number.isFinite))).sort((a,b)=>a-b);
      const latestWeekNo = weekNos.length ? weekNos[weekNos.length-1] : null;
      const latestRows = latestWeekNo === null ? [] : metrics.filter(metric => Number(metric.weekNo)===latestWeekNo);
      const sample = latestRows[0];

      function fmtDate(value) {
        if (!value) return "";
        const d = new Date(String(value)+"T00:00:00");
        return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
      }

      byId("leaderboardWeekLabel").textContent = sample
        ? `Top 10 by cumulative Bulk Questions Average through Week ${latestWeekNo} (${fmtDate(sample.weekStart)} – ${fmtDate(sample.weekEnd)}). Unanswered due Bulk Questions count as 0.`
        : "No completed Bulk Question week is available yet.";

      const batchNames = isPrivate
        ? ["Private learners"]
        : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || []).slice().sort());
      const wrap = byId("weeklyLeaderboard");
      if (!batchNames.length) {
        wrap.innerHTML = `<div class="line-empty">No batches set up yet for this selection.</div>`;
        return;
      }

      wrap.innerHTML = batchNames.map(batchName => {
        const ranked = latestRows.map(metric => {
          const student = studentByUuid.get(String(metric.studentUuid || ""));
          if (!student) return null;
          const batch = isPrivate ? "Private learners" : (student.batch || "No batch");
          if (batch !== batchName) return null;
          return {
            fullName:student.fullName || student.name || "",
            studentId:student.studentId || student.rollNo || "",
            average:Number(metric.average)
          };
        }).filter(entry => entry && Number.isFinite(entry.average))
          .sort((a,b)=>b.average-a.average || String(a.fullName).localeCompare(String(b.fullName)))
          .slice(0,10);

        const body = ranked.length
          ? `<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Rank</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Roll number</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Name</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Average score</th></tr></thead><tbody>${ranked.map((entry,index)=>`<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${index+1}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.studentId)}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.fullName)}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">${entry.average.toFixed(2)}</td></tr>`).join("")}</tbody></table>`
          : `<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No ranked students for this batch</div>`;
        return `<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">${escapeHtml(batchName)}</div>${body}</div>`;
      }).join("");
    }

    async function loadReport'''
text, dashboard_count = dashboard_pattern.subn(dashboard_replacement,text,count=1)

# Excel leaderboard: Week 1 is the cumulative average through Week 1;
# Week 2 is the cumulative average through Week 2; etc. No current incomplete
# week appears. The backend weeklyBulkMetrics uses the same denominator rule as
# Individual Student Performance.
excel_pattern = re.compile(
    r"    function buildWeeklyLeaderboardSheets\(workbookData\) \{.*?^    \}\n\n    function workbookProgressSummary",
    re.MULTILINE | re.DOTALL,
)
excel_replacement = r'''    function buildWeeklyLeaderboardSheets(workbookData) {
      const students = Array.isArray(workbookData.students) ? workbookData.students : [];
      const weeklyMetrics = Array.isArray(workbookData.weeklyBulkMetrics) ? workbookData.weeklyBulkMetrics : [];
      const completeStudents = Array.isArray(workbookData.bulkCompleteStudents) ? workbookData.bulkCompleteStudents : [];
      const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""),student]));
      const palette = ["DDEBF7","E2F0D9","FFF2CC","FCE4D6","E4DFEC","D9EAD3"];
      const output = [];

      function fmtDate(value) {
        if (!value) return "";
        const d = new Date(String(value) + "T00:00:00");
        return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
      }
      function applyFill(sheet,range,rgb) {
        for (let r=range.s.r;r<=range.e.r;r+=1) {
          for (let c=range.s.c;c<=range.e.c;c+=1) {
            const addr=XLSX.utils.encode_cell({r,c});
            if (!sheet[addr]) sheet[addr]={t:"s",v:""};
            sheet[addr].s=Object.assign({},sheet[addr].s||{},{fill:{patternType:"solid",fgColor:{rgb}}});
          }
        }
      }

      const weekNos = Array.from(new Set(weeklyMetrics.map(m=>Number(m.weekNo)).filter(Number.isFinite))).sort((a,b)=>a-b);
      const batchNames = Array.from(new Set(students.map(s=>exportText(s.batch)).filter(Boolean))).sort().reverse();

      batchNames.forEach(batchName => {
        const blockWidth=4, gap=1;
        const rows=[[],[]];
        for (let r=0;r<10;r+=1) rows.push([]);
        const merges=[], fills=[];

        weekNos.forEach((weekNo,weekIndex)=>{
          const entries=weeklyMetrics.filter(metric=>{
            if (Number(metric.weekNo)!==weekNo) return false;
            const student=studentByUuid.get(String(metric.studentUuid||""));
            return student && exportText(student.batch)===batchName;
          });
          const sample=entries[0] || weeklyMetrics.find(metric=>Number(metric.weekNo)===weekNo);
          const startCol=weekIndex*(blockWidth+gap);
          rows[0][startCol]=`Week ${weekNo} · ${sample?fmtDate(sample.weekStart):""} – ${sample?fmtDate(sample.weekEnd):""}`;
          merges.push({s:{r:0,c:startCol},e:{r:0,c:startCol+blockWidth-1}});
          ["Rank","Roll number","Name","Average score"].forEach((value,i)=>rows[1][startCol+i]=value);

          const ranked=entries.map(metric=>{
            const student=studentByUuid.get(String(metric.studentUuid||""));
            return {
              rollNo:student?exportText(student.rollNo||student.studentId):"",
              name:student?exportText(student.name||student.fullName):"",
              average:Number(metric.average)
            };
          }).filter(entry=>entry.name && Number.isFinite(entry.average))
            .sort((a,b)=>b.average-a.average || a.name.localeCompare(b.name))
            .slice(0,10);

          for(let rank=0;rank<10;rank+=1){
            const entry=ranked[rank], row=rows[rank+2];
            row[startCol]=rank+1;
            row[startCol+1]=entry?entry.rollNo:"";
            row[startCol+2]=entry?entry.name:"";
            row[startCol+3]=entry?Number(entry.average.toFixed(2)):"";
          }
          fills.push({range:{s:{r:0,c:startCol},e:{r:11,c:startCol+blockWidth-1}},rgb:palette[weekIndex%palette.length]});
        });

        const sheet=XLSX.utils.aoa_to_sheet(rows);
        sheet["!merges"]=merges;
        const cols=[]; weekNos.forEach(()=>cols.push({wch:8},{wch:18},{wch:28},{wch:16},{wch:3}));
        sheet["!cols"]=cols;
        fills.forEach(item=>applyFill(sheet,item.range,item.rgb));
        output.push({batchName,sheet});
      });

      const completeRows=[["Students who have submitted all Bulk Questions due through the latest completed week"],["Batch","Roll number","Name"]];
      const completeEntries=completeStudents.map(metric=>{
        const student=studentByUuid.get(String(metric.studentUuid||""));
        return student ? {
          batch:exportText(student.batch),
          rollNo:exportText(student.rollNo||student.studentId),
          name:exportText(student.name||student.fullName)
        } : null;
      }).filter(Boolean).sort((a,b)=>a.batch.localeCompare(b.batch)||a.name.localeCompare(b.name));
      completeEntries.forEach(entry=>completeRows.push([entry.batch,entry.rollNo,entry.name]));
      const completeSheet=XLSX.utils.aoa_to_sheet(completeRows);
      completeSheet["!merges"]=[{s:{r:0,c:0},e:{r:0,c:2}}];
      completeSheet["!cols"]=[{wch:14},{wch:18},{wch:30}];
      applyFill(completeSheet,{s:{r:0,c:0},e:{r:1,c:2}},"E2F0D9");
      output.push({batchName:"ALL RESPONSES SUBMITTED",sheet:completeSheet});

      return output;
    }

    function workbookProgressSummary'''
text, excel_count = excel_pattern.subn(excel_replacement,text,count=1)

text,_=re.subn(r'data-ascent-build="[^"]+"','data-ascent-build="2026-08-24.15"',text,count=1)

checks={
  "dashboard":dashboard_count or "cumulative Bulk Questions Average" in text,
  "excel":excel_count or "weeklyBulkMetrics" in text,
  "format":'"Rank","Roll number","Name","Average score"' in text,
  "single_list":"ALL RESPONSES SUBMITTED" in text,
  "build":'data-ascent-build="2026-08-24.15"' in text,
}
failed=[name for name,ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: "+", ".join(failed))

if text!=original:
    path.write_text(text,encoding="utf-8")
    print("trainer.html patched: cumulative weekly averages now match Individual Student Performance")
else:
    print("trainer.html already has cumulative weekly average leaderboard logic")
