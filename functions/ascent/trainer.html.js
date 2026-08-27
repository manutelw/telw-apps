export async function onRequest(context) {
  const response = await context.next();
  if (!response.ok) return response;

  let html = await response.text();

  // Keep the safer Excel download path.
  const oldExcel = `        XLSX.writeFile(
          workbook,
          \`ASCENT_\${institutionName}_Trainer_Report_\${new Date().toISOString().slice(0,10)}.xlsx\`,
          {cellStyles:true,cellDates:true}
        );`;
  const newExcel = `        const fileName = \`ASCENT_\${institutionName}_Trainer_Report_\${new Date().toISOString().slice(0,10)}.xlsx\`;
        const workbookBytes = XLSX.write(workbook,{bookType:"xlsx",type:"array",cellStyles:true,cellDates:true});
        const workbookBlob = new Blob([workbookBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
        const downloadUrl = URL.createObjectURL(workbookBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = downloadUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl),30000);`;
  if (html.includes(oldExcel)) html = html.replace(oldExcel,newExcel);

  // Preserve the dashboard/result rendering caps added during stabilisation.
  html = html.replace('visibleAssignmentRows.map(row =>','visibleAssignmentRows.slice(0,150).map(row =>');
  html = html.replace(
    'visibleResultRows = resultFilter(reportData.results || [],"result");',
    'visibleResultRows = resultFilter(reportData.results || [],"result").filter(row => Number(row.attemptCount || 0) > 0 || (row.latestScore !== null && row.latestScore !== undefined));'
  );
  html = html.replace('visibleResultRows.map(row =>','visibleResultRows.slice(0,300).map(row =>');

  // User-facing naming only. Internal CUSTOM values remain unchanged.
  html = html.replace('CUSTOM:"Custom"','CUSTOM:"Ascent Task"');
  html = html.replace('Custom Questions (ASCENT Task)','Ascent Task');

  const resultsFilterGuard = `
<script data-ascent-results-filter-guard="2026-08-27.3">
(function () {
  const RESULT_OPTIONS = [
    ["","All tasks"],
    ["PI","PI"],
    ["GD","GD"],
    ["LUM","LUM"],
    ["JD","JD"],
    ["ASCENT_TASK","Ascent Task"]
  ];
  let enforcing = false;

  function categoryOf(row) {
    const questionType = String(row && row.questionType || "").trim().toUpperCase();
    const rubricType = String(row && row.rubricType || "").trim().toUpperCase();
    const taskTitle = String(row && row.taskTitle || "").trim().toUpperCase();

    if (taskTitle.includes("JD INTERVIEW MAPPER") || taskTitle.startsWith("JD ") || taskTitle.includes("· JD")) return "JD";
    if (questionType === "GD" || rubricType === "GD") return "GD";
    if (questionType === "LUM") return "LUM";
    if (rubricType === "MANAGERIAL_COMMUNICATION" && (taskTitle.startsWith("LUM ") || taskTitle.includes(" LUM "))) return "LUM";
    if (questionType === "PI" || rubricType === "PI") return "PI";
    return "ASCENT_TASK";
  }

  function enforceResultTaskDropdown() {
    if (enforcing) return;
    const select = document.getElementById("resultTaskFilter");
    if (!select) return;

    const current = select.value;
    const wanted = RESULT_OPTIONS.map(item => item[0] + "|" + item[1]).join(";;");
    const actual = Array.from(select.options).map(option => option.value + "|" + option.textContent).join(";;");
    if (actual === wanted) return;

    enforcing = true;
    select.innerHTML = RESULT_OPTIONS.map(item => {
      const option = document.createElement("option");
      option.value = item[0];
      option.textContent = item[1];
      return option.outerHTML;
    }).join("");
    if (RESULT_OPTIONS.some(item => item[0] === current)) select.value = current;
    enforcing = false;
  }

  const originalPopulateControls = typeof populateControls === "function" ? populateControls : null;
  if (originalPopulateControls) {
    populateControls = function () {
      const result = originalPopulateControls.apply(this,arguments);
      enforceResultTaskDropdown();
      return result;
    };
  }

  const originalResultFilter = typeof resultFilter === "function" ? resultFilter : null;
  if (originalResultFilter) {
    resultFilter = function (rows,prefix) {
      if (prefix !== "result") return originalResultFilter.apply(this,arguments);

      const batch = byId("resultBatchFilter").value;
      const student = byId("resultStudentFilter").value;
      const task = byId("resultTaskFilter").value;
      const status = byId("resultStatusFilter").value;
      const from = byId("resultDateFrom").value;
      const to = byId("resultDateTo").value;

      return rows.filter(row => {
        if (batch && String(row.batch || "") !== batch) return false;
        if (student && row.studentUuid !== student) return false;
        if (task && categoryOf(row) !== task) return false;
        if (status && row.status !== status) return false;
        const dateValue = row.latestSubmittedAt || row.availableAt;
        if (from && dateValue && new Date(dateValue) < new Date(from + "T00:00:00")) return false;
        if (to && dateValue && new Date(dateValue) > new Date(to + "T23:59:59")) return false;
        return true;
      });
    };
  }

  function installObserver() {
    const select = document.getElementById("resultTaskFilter");
    if (!select) {
      window.setTimeout(installObserver,250);
      return;
    }
    enforceResultTaskDropdown();
    const observer = new MutationObserver(enforceResultTaskDropdown);
    observer.observe(select,{childList:true,subtree:true});
  }

  installObserver();
  window.setTimeout(enforceResultTaskDropdown,500);
  window.setTimeout(enforceResultTaskDropdown,1500);
  window.setTimeout(enforceResultTaskDropdown,3500);
})();
</script>`;

  const leaderboardGuard = `
<script data-ascent-leaderboard-fix="2026-08-27.3">
(function () {
  let busy = false;

  function weekBounds(value) {
    const d = value instanceof Date ? new Date(value) : new Date(value || Date.now());
    const offset = d.getDay() === 0 ? -6 : 1 - d.getDay();
    const start = new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate()+7);
    return {start,end};
  }

  async function refreshLiveLeaderboard() {
    if (busy || document.hidden) return;
    if (typeof currentSession === "undefined" || !currentSession || !currentSession.sessionToken) return;
    if (typeof RPC === "undefined" || !RPC || !RPC.report || typeof callRpc !== "function") return;
    busy = true;
    try {
      const data = await callRpc(RPC.report,{
        p_session_token:currentSession.sessionToken,
        p_batch:null,
        p_student_uuid:null,
        p_task_uuid:null,
        p_access_point_uuid:(typeof currentAccessPointUuid !== "undefined" ? currentAccessPointUuid : null)
      });
      if (data && data.ok === true) {
        reportData = Object.assign({},reportData || {},data,{
          accessPoints:Array.isArray(data.accessPoints) ? data.accessPoints : ((reportData && reportData.accessPoints) || []),
          institutionBatches:Array.isArray(data.batches) ? data.batches : ((reportData && reportData.institutionBatches) || [])
        });
        if (typeof renderWeeklyLeaderboard === "function") renderWeeklyLeaderboard();
      }
    } catch (error) {
      console.warn("ASCENT live leaderboard refresh skipped",error);
    } finally {
      busy = false;
    }
  }

  // The backend now includes the current week. Keep the board fresh without a manual refresh.
  window.setInterval(refreshLiveLeaderboard,10000);
  window.addEventListener("focus",() => window.setTimeout(refreshLiveLeaderboard,250));
  document.addEventListener("visibilitychange",() => { if (!document.hidden) window.setTimeout(refreshLiveLeaderboard,250); });

  // Ensure freshly downloaded workbooks include all scored weeks, including the current one.
  buildWeeklyLeaderboardSheets = function (workbookData) {
    const submissions = Array.isArray(workbookData.submissions) && workbookData.submissions.length
      ? workbookData.submissions
      : (Array.isArray(workbookData.assignments) ? workbookData.assignments : []);
    const scored = submissions.filter(row => {
      const score = exportNumber(row.finalScore !== undefined ? row.finalScore : (row.totalScore !== undefined ? row.totalScore : row.score));
      return Boolean(row.submissionUuid) && row.submittedAt && score !== null && !Number.isNaN(new Date(row.submittedAt).getTime());
    });
    if (!scored.length) return [];

    function rankedFor(rows) {
      const students = new Map();
      rows.forEach(row => {
        const score = exportNumber(row.finalScore !== undefined ? row.finalScore : (row.totalScore !== undefined ? row.totalScore : row.score));
        if (score === null) return;
        const key = String(row.studentUuid || row.rollNo || row.emailId || row.name || "");
        if (!students.has(key)) students.set(key,{name:exportText(row.name),rollNo:exportText(row.rollNo),scores:[]});
        students.get(key).scores.push(Number(score));
      });
      return Array.from(students.values()).map(student => ({
        name:student.name + (student.rollNo ? " (" + student.rollNo + ")" : ""),
        average:student.scores.reduce((a,b)=>a+b,0)/student.scores.length
      })).sort((a,b)=>b.average-a.average).slice(0,10);
    }

    const grouped = new Map();
    scored.forEach(row => {
      const batch = exportText(row.batch) || "No batch";
      const bounds = weekBounds(new Date(row.submittedAt));
      const key = bounds.start.getFullYear()+"-"+String(bounds.start.getMonth()+1).padStart(2,"0")+"-"+String(bounds.start.getDate()).padStart(2,"0");
      if (!grouped.has(batch)) grouped.set(batch,new Map());
      if (!grouped.get(batch).has(key)) grouped.get(batch).set(key,{weekStart:bounds.start,rows:[]});
      grouped.get(batch).get(key).rows.push(row);
    });

    const output = [];
    Array.from(grouped.keys()).sort().reverse().forEach(batch => {
      const weeks = Array.from(grouped.get(batch).values()).sort((a,b)=>a.weekStart-b.weekStart);
      const header=["Rank"], second=[""];
      weeks.forEach(week => {
        const end = new Date(week.weekStart); end.setDate(end.getDate()+6);
        header.push(week.weekStart.toLocaleDateString(undefined,{month:"short",day:"numeric"})+" – "+end.toLocaleDateString(undefined,{month:"short",day:"numeric"}),"");
        second.push("Name","Score");
      });
      const rows=[header,second];
      const rankings=weeks.map(week=>rankedFor(week.rows));
      for(let rank=0;rank<10;rank+=1){
        const row=[rank+1];
        rankings.forEach(list=>{const entry=list[rank];row.push(entry?entry.name:"",entry?Number(entry.average.toFixed(2)):"");});
        rows.push(row);
      }
      const sheet=XLSX.utils.aoa_to_sheet(rows);
      sheet["!merges"]=weeks.map((week,index)=>({s:{r:0,c:1+index*2},e:{r:0,c:2+index*2}}));
      sheet["!cols"]=[{wch:8}].concat(weeks.flatMap(()=>[{wch:30},{wch:10}]));
      output.push({batchName:batch,sheet});
    });
    return output;
  };
})();
</script>`;

  html = html.replace(/<script data-ascent-results-filter-guard="[^"]+">[\s\S]*?<\/script>/g,"");
  html = html.replace(/<script data-ascent-leaderboard-fix="[^"]+">[\s\S]*?<\/script>/g,"");
  html = html.replace('</body>', resultsFilterGuard + '\n' + leaderboardGuard + '\n</body>');

  const headers = new Headers(response.headers);
  headers.set("content-type","text/html; charset=UTF-8");
  headers.set("cache-control","no-store, max-age=0");

  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
