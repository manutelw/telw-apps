export async function onRequest(context) {
  const response = await context.next();
  if (!response.ok) return response;

  let html = await response.text();

  const oldBlock = `        XLSX.writeFile(
          workbook,
          \`ASCENT_\${institutionName}_Trainer_Report_\${new Date().toISOString().slice(0,10)}.xlsx\`,
          {cellStyles:true,cellDates:true}
        );`;

  const newBlock = `        const fileName = \`ASCENT_\${institutionName}_Trainer_Report_\${new Date().toISOString().slice(0,10)}.xlsx\`;
        const workbookBytes = XLSX.write(workbook,{
          bookType:"xlsx",
          type:"array",
          cellStyles:true,
          cellDates:true
        });
        const workbookBlob = new Blob(
          [workbookBytes],
          {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
        );
        const downloadUrl = URL.createObjectURL(workbookBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = downloadUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl),30000);`;

  if (html.includes(oldBlock)) html = html.replace(oldBlock, newBlock);

  html = html.replace('visibleAssignmentRows.map(row =>','visibleAssignmentRows.slice(0,150).map(row =>');
  html = html.replace('visibleResultRows = resultFilter(reportData.results || [],"result");','visibleResultRows = resultFilter(reportData.results || [],"result").filter(row => Number(row.attemptCount || 0) > 0 || (row.latestScore !== null && row.latestScore !== undefined));');
  html = html.replace('visibleResultRows.map(row =>','visibleResultRows.slice(0,300).map(row =>');

  const leaderboardFix = `
<script data-ascent-leaderboard-fix="2026-08-27.2">
(function () {
  var realtimeLeaderboardBusy = false;

  function weekBoundsForDate(value) {
    var d = value instanceof Date ? new Date(value) : new Date(value || Date.now());
    var day = d.getDay();
    var mondayOffset = day === 0 ? -6 : 1 - day;
    var start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + mondayOffset);
    start.setHours(0,0,0,0);
    var end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {start:start,end:end};
  }

  renderWeeklyLeaderboard = function () {
    var current = weekBoundsForDate(new Date());
    var start = current.start;
    var end = current.end;
    var active = selectedDashboardAccessPoint();
    var isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
    var batchFilter = byId("dashboardBatchFilter");
    var selectedBatch = batchFilter ? batchFilter.value : "";
    var batchNames = isPrivate
      ? ["Private learners"]
      : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || reportData.batches || []).slice().sort());
    var wrap = byId("weeklyLeaderboard");
    if (!wrap) return;

    if (!batchNames.length) {
      wrap.innerHTML = '<div class="line-empty">No batches set up yet for this selection.</div>';
      return;
    }

    var rows = filteredDashboardResults().filter(function (row) {
      if (!row || row.latestScore === null || row.latestScore === undefined || !row.latestSubmittedAt) return false;
      var submitted = new Date(row.latestSubmittedAt);
      return !Number.isNaN(submitted.getTime()) && submitted >= start && submitted < end;
    });

    var endLabelDate = new Date(end.getTime() - 86400000);
    var label = byId("leaderboardWeekLabel");
    if (label) {
      label.textContent = "Live · current week · " + start.toLocaleDateString(undefined,{month:"short",day:"numeric"}) + " – " + endLabelDate.toLocaleDateString(undefined,{month:"short",day:"numeric"}) + " · updates automatically";
    }

    var byBatch = new Map();
    rows.forEach(function (row) {
      var batchKey = isPrivate ? "Private learners" : (row.batch || "No batch");
      if (!byBatch.has(batchKey)) byBatch.set(batchKey,new Map());
      var byStudent = byBatch.get(batchKey);
      var key = row.studentUuid || row.studentId || row.email;
      if (!byStudent.has(key)) byStudent.set(key,{fullName:row.fullName,studentId:row.studentId,scores:[]});
      byStudent.get(key).scores.push(Number(row.latestScore));
    });

    wrap.innerHTML = batchNames.map(function (batchName) {
      var studentMap = byBatch.get(batchName);
      var ranked = studentMap ? Array.from(studentMap.values()).map(function (entry) {
        return {fullName:entry.fullName,studentId:entry.studentId,average:entry.scores.reduce(function(a,b){return a+b;},0)/entry.scores.length};
      }).sort(function(a,b){return b.average-a.average;}).slice(0,10) : [];
      var body = ranked.length
        ? '<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">#</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Student</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Avg Score</th></tr></thead><tbody>' + ranked.map(function(entry,index){return '<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">'+(index+1)+'</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">'+escapeHtml(entry.fullName)+'<br><span class="form-note">'+escapeHtml(entry.studentId)+'</span></td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">'+entry.average.toFixed(2)+'</td></tr>';}).join('') + '</tbody></table>'
        : '<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No scored submissions yet in the current week</div>';
      return '<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">'+escapeHtml(batchName)+'</div>'+body+'</div>';
    }).join('');
  };

  async function refreshLeaderboardRealtime() {
    if (realtimeLeaderboardBusy || document.hidden) return;
    if (typeof currentSession === "undefined" || !currentSession || !currentSession.sessionToken) return;
    if (typeof RPC === "undefined" || !RPC || !RPC.report || typeof callRpc !== "function") return;

    realtimeLeaderboardBusy = true;
    try {
      var data = await callRpc(RPC.report,{
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
        renderWeeklyLeaderboard();
      }
    } catch (error) {
      console.warn("ASCENT live leaderboard refresh skipped",error);
    } finally {
      realtimeLeaderboardBusy = false;
    }
  }

  window.setInterval(refreshLeaderboardRealtime,10000);
  window.addEventListener("focus",function(){ window.setTimeout(refreshLeaderboardRealtime,250); });
  document.addEventListener("visibilitychange",function(){ if (!document.hidden) window.setTimeout(refreshLeaderboardRealtime,250); });

  buildWeeklyLeaderboardSheets = function (workbookData) {
    var submissions = Array.isArray(workbookData.submissions) && workbookData.submissions.length ? workbookData.submissions : (Array.isArray(workbookData.assignments) ? workbookData.assignments : []);
    submissions = submissions.filter(function (row) {
      var score = exportNumber(row.finalScore !== undefined ? row.finalScore : (row.totalScore !== undefined ? row.totalScore : row.score));
      return Boolean(row.submissionUuid) && row.submittedAt && score !== null && !Number.isNaN(new Date(row.submittedAt).getTime());
    });
    if (!submissions.length) return [];

    function rankedFor(rows) {
      var students = new Map();
      rows.forEach(function (row) {
        var score = exportNumber(row.finalScore !== undefined ? row.finalScore : (row.totalScore !== undefined ? row.totalScore : row.score));
        if (score === null) return;
        var key = String(row.studentUuid || row.rollNo || row.emailId || row.name || '');
        if (!students.has(key)) students.set(key,{name:exportText(row.name),rollNo:exportText(row.rollNo),scores:[]});
        students.get(key).scores.push(Number(score));
      });
      return Array.from(students.values()).map(function (student) {
        return {name:student.name + (student.rollNo ? ' (' + student.rollNo + ')' : ''),average:student.scores.reduce(function(a,b){return a+b;},0)/student.scores.length};
      }).sort(function(a,b){return b.average-a.average;}).slice(0,10);
    }

    var current = weekBoundsForDate(new Date());
    var currentRows = submissions.filter(function (row) { var d=new Date(row.submittedAt); return d>=current.start && d<current.end; });
    var currentBatchNames = Array.from(new Set(currentRows.map(function(row){return exportText(row.batch)||'No batch';}))).sort().reverse();
    var currentDateLabel = current.start.toLocaleDateString(undefined,{month:'short',day:'numeric'}) + ' – ' + new Date(current.end.getTime()-86400000).toLocaleDateString(undefined,{month:'short',day:'numeric'});
    var combinedRows = [['Rank']];
    currentBatchNames.forEach(function(batch){combinedRows[0].push(batch+' · '+currentDateLabel,'');});
    var subheads=['']; currentBatchNames.forEach(function(){subheads.push('Name','Score');}); combinedRows.push(subheads);
    var currentRanked=currentBatchNames.map(function(batch){return rankedFor(currentRows.filter(function(row){return (exportText(row.batch)||'No batch')===batch;}));});
    for(var rank=0;rank<10;rank+=1){var cr=[rank+1];currentRanked.forEach(function(list){var entry=list[rank];cr.push(entry?entry.name:'',entry?Number(entry.average.toFixed(2)):'');});combinedRows.push(cr);}
    var combinedSheet=XLSX.utils.aoa_to_sheet(combinedRows);
    combinedSheet['!merges']=currentBatchNames.map(function(batch,index){return {s:{r:0,c:1+index*2},e:{r:0,c:2+index*2}};});
    combinedSheet['!cols']=[{wch:8}].concat(currentBatchNames.flatMap(function(){return [{wch:30},{wch:10}];}));
    var output=[{batchName:'CURRENT WEEK',sheet:combinedSheet}];

    var grouped=new Map();
    submissions.forEach(function(row){
      var batch=exportText(row.batch)||'No batch';
      var bounds=weekBoundsForDate(new Date(row.submittedAt));
      var key=bounds.start.getFullYear()+'-'+String(bounds.start.getMonth()+1).padStart(2,'0')+'-'+String(bounds.start.getDate()).padStart(2,'0');
      if(!grouped.has(batch)) grouped.set(batch,new Map());
      if(!grouped.get(batch).has(key)) grouped.get(batch).set(key,{weekStart:bounds.start,rows:[]});
      grouped.get(batch).get(key).rows.push(row);
    });

    Array.from(grouped.keys()).sort().reverse().forEach(function(batch){
      var weeks=Array.from(grouped.get(batch).values()).sort(function(a,b){return b.weekStart-a.weekStart;});
      var header=['Rank']; var second=[''];
      weeks.forEach(function(week){var e=new Date(week.weekStart);e.setDate(e.getDate()+6);header.push(week.weekStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' – '+e.toLocaleDateString(undefined,{month:'short',day:'numeric'}),'');second.push('Name','Score');});
      var rows=[header,second]; var rankings=weeks.map(function(week){return rankedFor(week.rows);});
      for(var r=0;r<10;r+=1){var rr=[r+1];rankings.forEach(function(list){var entry=list[r];rr.push(entry?entry.name:'',entry?Number(entry.average.toFixed(2)):'');});rows.push(rr);}
      var sheet=XLSX.utils.aoa_to_sheet(rows);
      sheet['!merges']=weeks.map(function(week,index){return {s:{r:0,c:1+index*2},e:{r:0,c:2+index*2}};});
      sheet['!cols']=[{wch:8}].concat(weeks.flatMap(function(){return [{wch:30},{wch:10}];}));
      output.push({batchName:batch,sheet:sheet});
    });
    return output;
  };
})();
</script>`;

  html = html.replace(/<script data-ascent-leaderboard-fix="[^"]+">[\s\S]*?<\/script>/,"");
  html = html.replace('</body>', leaderboardFix + '\n</body>');

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "no-store, max-age=0");

  return new Response(html, {status:response.status,statusText:response.statusText,headers});
}
