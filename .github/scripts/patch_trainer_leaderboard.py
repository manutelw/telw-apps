from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# Dashboard leaderboard: show the latest COMPLETED Monday-Sunday week only.
# A student appears only if they actually submitted a Bulk response in that week.
leaderboard_pattern = re.compile(
    r"    function renderWeeklyLeaderboard\(\) \{.*?^    \}\n\n    async function loadReport",
    re.MULTILINE | re.DOTALL,
)
leaderboard_replacement = r'''    function renderWeeklyLeaderboard() {
      const active = selectedDashboardAccessPoint();
      const isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
      const selectedBatch = byId("dashboardBatchFilter").value;
      const results = Array.isArray(reportData.results) ? reportData.results : [];

      function startOfMonday(value) {
        const d = value ? new Date(value) : new Date();
        d.setHours(0,0,0,0);
        const day = d.getDay();
        d.setDate(d.getDate() - ((day + 6) % 7));
        return d;
      }
      function shortDate(d) {
        return d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
      }

      const currentMonday = startOfMonday();
      const weekStart = new Date(currentMonday);
      weekStart.setDate(weekStart.getDate()-7);
      const weekEndExclusive = new Date(currentMonday);
      const weekEndLabel = new Date(currentMonday);
      weekEndLabel.setDate(weekEndLabel.getDate()-1);

      byId("leaderboardWeekLabel").textContent =
        `Top 10 by average Bulk score for the latest completed week, ${shortDate(weekStart)} – ${shortDate(weekEndLabel)}. Only students who submitted in that week are included.`;

      const students = Array.isArray(reportData.students) ? reportData.students : [];
      const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""),student]));
      const grouped = new Map();

      results.forEach(result => {
        if (String(result.questionType || "").toUpperCase() !== "BULK") return;
        if (!result.latestSubmittedAt) return;
        const submitted = new Date(result.latestSubmittedAt);
        if (!(submitted >= weekStart && submitted < weekEndExclusive)) return;
        const score = Number(result.latestScore);
        if (!Number.isFinite(score)) return;
        const student = studentByUuid.get(String(result.studentUuid || ""));
        if (!student) return;
        const batch = isPrivate ? "Private learners" : (student.batch || "No batch");
        if (selectedBatch && !isPrivate && batch !== selectedBatch) return;
        const key = `${batch}|||${String(result.studentUuid || "")}`;
        if (!grouped.has(key)) grouped.set(key,{batch,studentUuid:String(result.studentUuid || ""),scores:[]});
        grouped.get(key).scores.push(score);
      });

      const batchNames = isPrivate
        ? ["Private learners"]
        : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || []).slice().sort());
      const wrap = byId("weeklyLeaderboard");
      if (!batchNames.length) {
        wrap.innerHTML = `<div class="line-empty">No batches set up yet for this selection.</div>`;
        return;
      }

      wrap.innerHTML = batchNames.map(batchName => {
        const ranked = Array.from(grouped.values())
          .filter(item => item.batch === batchName)
          .map(item => {
            const student = studentByUuid.get(item.studentUuid);
            return {
              fullName: student ? (student.fullName || student.name || "") : "",
              studentId: student ? (student.studentId || student.rollNo || "") : "",
              average: item.scores.reduce((sum,v)=>sum+v,0)/item.scores.length
            };
          })
          .sort((a,b)=>b.average-a.average || String(a.fullName).localeCompare(String(b.fullName)))
          .slice(0,10);
        const body = ranked.length
          ? `<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Rank</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Roll number</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Name</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Average score</th></tr></thead><tbody>${ranked.map((entry,index)=>`<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${index+1}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.studentId)}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">${escapeHtml(entry.fullName)}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">${entry.average.toFixed(2)}</td></tr>`).join("")}</tbody></table>`
          : `<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No Bulk submissions in this completed week</div>`;
        return `<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">${escapeHtml(batchName)}</div>${body}</div>`;
      }).join("");
    }

    async function loadReport'''
text, dashboard_count = leaderboard_pattern.subn(leaderboard_replacement, text, count=1)

# Excel leaderboard: completed weeks only. Each weekly block is based ONLY on Bulk
# responses submitted during that week. No current-week block is created.
excel_pattern = re.compile(
    r"    function buildWeeklyLeaderboardSheets\(workbookData\) \{.*?^    \}\n\n    function workbookProgressSummary",
    re.MULTILINE | re.DOTALL,
)
excel_replacement = r'''    function buildWeeklyLeaderboardSheets(workbookData) {
      const students = Array.isArray(workbookData.students) ? workbookData.students : [];
      const results = Array.isArray(workbookData.results) ? workbookData.results : [];
      const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""),student]));
      const palette = ["DDEBF7","E2F0D9","FFF2CC","FCE4D6","E4DFEC","D9EAD3"];
      const output = [];

      function startOfMonday(value) {
        const d = value ? new Date(value) : new Date();
        d.setHours(0,0,0,0);
        const day = d.getDay();
        d.setDate(d.getDate() - ((day + 6) % 7));
        return d;
      }
      function fmtDate(d) {
        return d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
      }
      function applyFill(sheet, range, rgb) {
        for (let r=range.s.r; r<=range.e.r; r+=1) {
          for (let c=range.s.c; c<=range.e.c; c+=1) {
            const addr=XLSX.utils.encode_cell({r,c});
            if (!sheet[addr]) sheet[addr]={t:"s",v:""};
            sheet[addr].s=Object.assign({},sheet[addr].s||{},{fill:{patternType:"solid",fgColor:{rgb}}});
          }
        }
      }

      const bulkResults = results.filter(result =>
        String(result.questionType || "").toUpperCase()==="BULK" &&
        result.latestSubmittedAt && Number.isFinite(Number(result.latestScore))
      );
      const currentMonday = startOfMonday();
      const completedBulkResults = bulkResults.filter(result => new Date(result.latestSubmittedAt) < currentMonday);
      const weekStartKeys = Array.from(new Set(completedBulkResults.map(result => startOfMonday(result.latestSubmittedAt).toISOString().slice(0,10)))).sort();
      const batchNames = Array.from(new Set(students.map(student=>exportText(student.batch)).filter(Boolean))).sort().reverse();

      batchNames.forEach(batchName => {
        const blockWidth=4, gap=1;
        const rows=[[],[]];
        for (let r=0;r<10;r+=1) rows.push([]);
        const merges=[];
        const fills=[];

        weekStartKeys.forEach((key,weekIndex)=>{
          const weekStart=new Date(key+"T00:00:00");
          const weekEndExclusive=new Date(weekStart); weekEndExclusive.setDate(weekEndExclusive.getDate()+7);
          const weekEndLabel=new Date(weekEndExclusive); weekEndLabel.setDate(weekEndLabel.getDate()-1);
          const startCol=weekIndex*(blockWidth+gap);
          rows[0][startCol]=`Week ${weekIndex+1} · ${fmtDate(weekStart)} – ${fmtDate(weekEndLabel)}`;
          merges.push({s:{r:0,c:startCol},e:{r:0,c:startCol+blockWidth-1}});
          ["Rank","Roll number","Name","Average score"].forEach((value,i)=>rows[1][startCol+i]=value);

          const grouped=new Map();
          completedBulkResults.forEach(result=>{
            const submitted=new Date(result.latestSubmittedAt);
            if (!(submitted>=weekStart && submitted<weekEndExclusive)) return;
            const student=studentByUuid.get(String(result.studentUuid||""));
            if (!student || exportText(student.batch)!==batchName) return;
            const studentKey=String(result.studentUuid||"");
            if (!grouped.has(studentKey)) grouped.set(studentKey,[]);
            grouped.get(studentKey).push(Number(result.latestScore));
          });
          const ranked=Array.from(grouped.entries()).map(([studentUuid,scores])=>{
            const student=studentByUuid.get(studentUuid);
            return {
              rollNo:student?exportText(student.rollNo||student.studentId):"",
              name:student?exportText(student.name||student.fullName):"",
              average:scores.reduce((sum,v)=>sum+v,0)/scores.length
            };
          }).sort((a,b)=>b.average-a.average || a.name.localeCompare(b.name)).slice(0,10);

          for (let rank=0;rank<10;rank+=1) {
            const entry=ranked[rank];
            const row=rows[rank+2];
            row[startCol]=rank+1;
            row[startCol+1]=entry?entry.rollNo:"";
            row[startCol+2]=entry?entry.name:"";
            row[startCol+3]=entry?Number(entry.average.toFixed(2)):"";
          }
          fills.push({range:{s:{r:0,c:startCol},e:{r:11,c:startCol+blockWidth-1}},rgb:palette[weekIndex%palette.length]});
        });

        const sheet=XLSX.utils.aoa_to_sheet(rows);
        sheet["!merges"]=merges;
        const cols=[]; weekStartKeys.forEach(()=>cols.push({wch:8},{wch:18},{wch:28},{wch:16},{wch:3}));
        sheet["!cols"]=cols;
        fills.forEach(item=>applyFill(sheet,item.range,item.rgb));
        output.push({batchName,sheet});
      });

      // Separate list of actual submitters in each completed week.
      if (weekStartKeys.length) {
        const blockWidth=4, gap=1;
        const weeklyEntries=weekStartKeys.map(key=>{
          const weekStart=new Date(key+"T00:00:00");
          const weekEndExclusive=new Date(weekStart); weekEndExclusive.setDate(weekEndExclusive.getDate()+7);
          const byStudent=new Map();
          completedBulkResults.forEach(result=>{
            const submitted=new Date(result.latestSubmittedAt);
            if (!(submitted>=weekStart && submitted<weekEndExclusive)) return;
            const student=studentByUuid.get(String(result.studentUuid||""));
            if (!student) return;
            const studentKey=String(result.studentUuid||"");
            if (!byStudent.has(studentKey)) byStudent.set(studentKey,{student,count:0});
            byStudent.get(studentKey).count+=1;
          });
          return Array.from(byStudent.values()).sort((a,b)=>exportText(a.student.batch).localeCompare(exportText(b.student.batch)) || exportText(a.student.name||a.student.fullName).localeCompare(exportText(b.student.name||b.student.fullName)));
        });
        const maxRows=Math.max(...weeklyEntries.map(items=>items.length),0);
        const rows=[[],[]]; for(let r=0;r<maxRows;r+=1) rows.push([]);
        const merges=[],fills=[];
        weekStartKeys.forEach((key,weekIndex)=>{
          const weekStart=new Date(key+"T00:00:00");
          const weekEnd=new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+6);
          const startCol=weekIndex*(blockWidth+gap);
          rows[0][startCol]=`Week ${weekIndex+1} · ${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`;
          merges.push({s:{r:0,c:startCol},e:{r:0,c:startCol+blockWidth-1}});
          ["Batch","Roll number","Name","Responses submitted"].forEach((value,i)=>rows[1][startCol+i]=value);
          weeklyEntries[weekIndex].forEach((entry,index)=>{
            const row=rows[index+2];
            row[startCol]=exportText(entry.student.batch);
            row[startCol+1]=exportText(entry.student.rollNo||entry.student.studentId);
            row[startCol+2]=exportText(entry.student.name||entry.student.fullName);
            row[startCol+3]=entry.count;
          });
          fills.push({range:{s:{r:0,c:startCol},e:{r:Math.max(1,maxRows+1),c:startCol+blockWidth-1}},rgb:palette[weekIndex%palette.length]});
        });
        const sheet=XLSX.utils.aoa_to_sheet(rows);
        sheet["!merges"]=merges;
        const cols=[]; weekStartKeys.forEach(()=>cols.push({wch:14},{wch:18},{wch:28},{wch:20},{wch:3}));
        sheet["!cols"]=cols;
        fills.forEach(item=>applyFill(sheet,item.range,item.rgb));
        output.push({batchName:"WEEKLY SUBMITTERS",sheet});
      }

      return output;
    }

    function workbookProgressSummary'''
text, excel_count = excel_pattern.subn(excel_replacement, text, count=1)

text, _ = re.subn(r'data-ascent-build="[^"]+"','data-ascent-build="2026-08-24.13"',text,count=1)

checks={
  "dashboard":dashboard_count or "latest completed week" in text,
  "excel":excel_count or '"Rank","Roll number","Name","Average score"' in text,
  "no_current_week":"new Date(result.latestSubmittedAt) < currentMonday" in text,
  "build":'data-ascent-build="2026-08-24.13"' in text,
}
failed=[name for name,ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: "+", ".join(failed))

if text!=original:
    path.write_text(text,encoding="utf-8")
    print("trainer.html patched: completed-week leaderboard uses only that week's submitters")
else:
    print("trainer.html already has completed-week leaderboard logic")
