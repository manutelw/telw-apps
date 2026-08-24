from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

# Excel leaderboard: use backend weeklyBulkMetrics, which contains only actual
# scored BULK submissions in COMPLETED Monday-Sunday weeks. No carry-forward,
# and no current incomplete week.
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

      // ONE cumulative compliance list: students who have submitted every Bulk
      // Question due by the start of the current week. Today's newly released
      // question is therefore not included until next Monday.
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

text,_=re.subn(r'data-ascent-build="[^"]+"','data-ascent-build="2026-08-24.14"',text,count=1)

checks={
  "excel":excel_count or "bulkCompleteStudents" in text,
  "format":'"Rank","Roll number","Name","Average score"' in text,
  "single_list":"ALL RESPONSES SUBMITTED" in text,
  "build":'data-ascent-build="2026-08-24.14"' in text,
}
failed=[name for name,ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: "+", ".join(failed))

if text!=original:
    path.write_text(text,encoding="utf-8")
    print("trainer.html patched: weekly leaderboard and cumulative completion list fixed")
else:
    print("trainer.html already has corrected weekly leaderboard and completion list")
