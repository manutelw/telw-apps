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

  if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
  }

  html = html.replace(
    'visibleAssignmentRows.map(row =>',
    'visibleAssignmentRows.slice(0,150).map(row =>'
  );

  html = html.replace(
    'visibleResultRows = resultFilter(reportData.results || [],"result");',
    'visibleResultRows = resultFilter(reportData.results || [],"result").filter(row => Number(row.attemptCount || 0) > 0 || (row.latestScore !== null && row.latestScore !== undefined));'
  );

  html = html.replace(
    'visibleResultRows.map(row =>',
    'visibleResultRows.slice(0,300).map(row =>'
  );

  const leaderboardFix = `
<script data-ascent-leaderboard-fix="2026-08-24.5">
(function () {
  function latestPopulatedWeek(rows) {
    var valid = rows.filter(function (row) {
      return row && row.latestSubmittedAt && row.latestScore !== null && row.latestScore !== undefined && !Number.isNaN(new Date(row.latestSubmittedAt).getTime());
    });
    if (!valid.length) return null;
    var latestTime = Math.max.apply(null, valid.map(function (row) { return new Date(row.latestSubmittedAt).getTime(); }));
    var latest = new Date(latestTime);
    var day = latest.getDay();
    var mondayOffset = day === 0 ? -6 : 1 - day;
    var start = new Date(latest.getFullYear(), latest.getMonth(), latest.getDate() + mondayOffset);
    start.setHours(0,0,0,0);
    var end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {start:start,end:end};
  }

  renderWeeklyLeaderboard = function () {
    var current = currentWeekBounds();
    var start = current.start;
    var end = current.end;
    var active = selectedDashboardAccessPoint();
    var isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
    var selectedBatch = byId("dashboardBatchFilter").value;
    var batchNames = isPrivate
      ? ["Private learners"]
      : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || []).slice().sort());
    var wrap = byId("weeklyLeaderboard");
    if (!batchNames.length) {
      wrap.innerHTML = '<div class="line-empty">No batches set up yet for this selection.</div>';
      return;
    }

    var scoredRows = filteredDashboardResults().filter(function (row) {
      return row.latestScore !== null && row.latestScore !== undefined && row.latestSubmittedAt && !Number.isNaN(new Date(row.latestSubmittedAt).getTime());
    });
    var rows = scoredRows.filter(function (row) {
      var submitted = new Date(row.latestSubmittedAt);
      return submitted >= start && submitted < end;
    });
    var fallback = false;
    if (!rows.length && scoredRows.length) {
      var latestWeek = latestPopulatedWeek(scoredRows);
      if (latestWeek) {
        start = latestWeek.start;
        end = latestWeek.end;
        rows = scoredRows.filter(function (row) {
          var submitted = new Date(row.latestSubmittedAt);
          return submitted >= start && submitted < end;
        });
        fallback = true;
      }
    }

    var endLabelDate = new Date(end.getTime() - 86400000);
    byId("leaderboardWeekLabel").textContent = (fallback ? "Latest week with submissions" : "Top 10 by average score") + ", " + start.toLocaleDateString(undefined,{month:"short",day:"numeric"}) + " – " + endLabelDate.toLocaleDateString(undefined,{month:"short",day:"numeric"}) + ".";

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
        : '<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No submissions in this week</div>';
      return '<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">'+escapeHtml(batchName)+'</div>'+body+'</div>';
    }).join('');
  };

  buildWeeklyLeaderboardSheets = function (workbookData) {
    var submissions = Array.isArray(workbookData.submissions) && workbookData.submissions.length
      ? workbookData.submissions
      : (Array.isArray(workbookData.assignments) ? workbookData.assignments : []);
    submissions = submissions.filter(function (row) {
      var score = exportNumber(row.finalScore !== undefined ? row.finalScore : (row.totalScore !== undefined ? row.totalScore : row.score));
      return Boolean(row.submissionUuid) && row.submittedAt && score !== null;
    });
    if (!submissions.length) return [];

    var latestTime = Math.max.apply(null, submissions.map(function (row) { return new Date(row.submittedAt).getTime(); }).filter(Number.isFinite));
    var latestDate = new Date(latestTime);
    var day = latestDate.getDay();
    var mondayOffset = day === 0 ? -6 : 1 - day;
    var latestStart = new Date(latestDate.getFullYear(),latestDate.getMonth(),latestDate.getDate()+mondayOffset);
    latestStart.setHours(0,0,0,0);
    var latestEnd = new Date(latestStart); latestEnd.setDate(latestEnd.getDate()+7);

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

    var latestRows = submissions.filter(function (row) {
      var d = new Date(row.submittedAt);
      return d >= latestStart && d < latestEnd;
    });
    var batchNames = Array.from(new Set(latestRows.map(function(row){return exportText(row.batch)||'No batch';}))).sort().reverse();
    var dateLabel = latestStart.toLocaleDateString(undefined,{month:'short',day:'numeric'}) + ' – ' + new Date(latestEnd.getTime()-86400000).toLocaleDateString(undefined,{month:'short',day:'numeric'});
    var combinedRows = [['Rank']];
    batchNames.forEach(function(batch){ combinedRows[0].push(batch + ' · ' + dateLabel,''); });
    var subheads = ['']; batchNames.forEach(function(){subheads.push('Name','Score');}); combinedRows.push(subheads);
    var latestRanked = batchNames.map(function(batch){return rankedFor(latestRows.filter(function(row){return (exportText(row.batch)||'No batch')===batch;}));});
    for (var rank=0; rank<10; rank+=1) {
      var row = [rank+1];
      latestRanked.forEach(function(list){var entry=list[rank]; row.push(entry?entry.name:'', entry?Number(entry.average.toFixed(2)):'');});
      combinedRows.push(row);
    }
    var combinedSheet = XLSX.utils.aoa_to_sheet(combinedRows);
    combinedSheet['!merges'] = batchNames.map(function(batch,index){return {s:{r:0,c:1+index*2},e:{r:0,c:2+index*2}};});
    combinedSheet['!cols'] = [{wch:8}].concat(batchNames.flatMap(function(){return [{wch:30},{wch:10}];}));
    var output = [{batchName:'LATEST LEADERBOARD',sheet:combinedSheet}];

    var grouped = new Map();
    submissions.forEach(function (row) {
      var batch = exportText(row.batch)||'No batch';
      var d = new Date(row.submittedAt);
      var wd = d.getDay();
      var offset = wd===0?-6:1-wd;
      var ws = new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset); ws.setHours(0,0,0,0);
      var key = ws.toISOString().slice(0,10);
      if (!grouped.has(batch)) grouped.set(batch,new Map());
      if (!grouped.get(batch).has(key)) grouped.get(batch).set(key,{weekStart:ws,rows:[]});
      grouped.get(batch).get(key).rows.push(row);
    });

    Array.from(grouped.keys()).sort().reverse().forEach(function (batch) {
      var weeks = Array.from(grouped.get(batch).values()).sort(function(a,b){return b.weekStart-a.weekStart;});
      var header = ['Rank'];
      var second = [''];
      weeks.forEach(function(week){var e=new Date(week.weekStart);e.setDate(e.getDate()+6);header.push(week.weekStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' – '+e.toLocaleDateString(undefined,{month:'short',day:'numeric'}),'');second.push('Name','Score');});
      var rows = [header,second];
      var rankings = weeks.map(function(week){return rankedFor(week.rows);});
      for (var r=0;r<10;r+=1){var rr=[r+1];rankings.forEach(function(list){var entry=list[r];rr.push(entry?entry.name:'',entry?Number(entry.average.toFixed(2)):'');});rows.push(rr);}
      var sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet['!merges'] = weeks.map(function(week,index){return {s:{r:0,c:1+index*2},e:{r:0,c:2+index*2}};});
      sheet['!cols'] = [{wch:8}].concat(weeks.flatMap(function(){return [{wch:30},{wch:10}];}));
      output.push({batchName:batch,sheet:sheet});
    });
    return output;
  };
})();
</script>`;

  if (!html.includes('data-ascent-leaderboard-fix="2026-08-24.5"')) {
    html = html.replace('</body>', leaderboardFix + '\n</body>');
  }

  html = html.replace(
    'data-ascent-build="2026-08-04.5"',
    'data-ascent-build="2026-08-24.5"'
  );

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "no-store, max-age=0");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
