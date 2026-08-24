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

  const trainerResultsHotfix = String.raw`
<script data-ascent-results-hotfix="2026-08-24.1">
(() => {
  const PAGE_SIZE = 150;
  let assignmentPage = 1;
  let resultPage = 1;

  const pagedTableControls = (prefix,page,totalPages,startIndex,totalRows) => totalPages > 1
    ? \`<div class="inline-row" style="justify-content:space-between;padding:10px 0 12px"><span class="panel-subtitle">Showing \${startIndex + 1}–\${Math.min(startIndex + PAGE_SIZE,totalRows)} of \${totalRows}</span><span class="inline-row"><button id="\${prefix}PrevPage" class="small-button" type="button" \${page <= 1 ? "disabled" : ""}>Previous</button><button id="\${prefix}NextPage" class="small-button" type="button" \${page >= totalPages ? "disabled" : ""}>Next</button></span></div>\`
    : "";

  renderAssignmentsTable = function() {
    visibleAssignmentRows = resultFilter(reportData.results || [],"assignment");
    const totalPages = Math.max(1,Math.ceil(visibleAssignmentRows.length / PAGE_SIZE));
    assignmentPage = Math.min(Math.max(assignmentPage,1),totalPages);
    const startIndex = (assignmentPage - 1) * PAGE_SIZE;
    const pageRows = visibleAssignmentRows.slice(startIndex,startIndex + PAGE_SIZE);
    byId("assignmentCountLabel").textContent = \`\${visibleAssignmentRows.length} assignments · page \${assignmentPage} of \${totalPages}\`;
    if (!visibleAssignmentRows.length) {
      byId("assignmentsTableWrap").innerHTML = \`<div class="empty-state">No assignments match these filters.</div>\`;
      return;
    }
    const pager = pagedTableControls("assignment",assignmentPage,totalPages,startIndex,visibleAssignmentRows.length);
    byId("assignmentsTableWrap").innerHTML = \`\${pager}<table><thead><tr><th>Student</th><th>Batch</th><th>Task</th><th>Available</th><th>Due</th><th>Submitted</th><th>Status</th></tr></thead><tbody>\${pageRows.map(row => \`<tr><td><strong>\${escapeHtml(row.fullName)}</strong><br>\${escapeHtml(row.studentId)}</td><td>\${escapeHtml(row.batch || "—")}</td><td class="question-cell"><strong>\${escapeHtml(row.taskTitle)}</strong><br>\${escapeHtml(row.question)}</td><td>\${escapeHtml(formatDate(row.availableAt))}</td><td>\${escapeHtml(formatDate(row.dueAt))}</td><td>\${Number(row.attemptCount || 0) > 0 ? "Yes" : "No"}</td><td><span class="status-badge \${statusClass(row.status)}">\${escapeHtml(row.status)}</span></td></tr>\`).join("")}</tbody></table>\`;
    const prev = byId("assignmentPrevPage");
    const next = byId("assignmentNextPage");
    if (prev) prev.addEventListener("click",() => { assignmentPage -= 1; renderAssignmentsTable(); byId("assignmentsTableWrap").scrollIntoView({block:"start"}); });
    if (next) next.addEventListener("click",() => { assignmentPage += 1; renderAssignmentsTable(); byId("assignmentsTableWrap").scrollIntoView({block:"start"}); });
  };

  renderResultsTable = function() {
    visibleResultRows = resultFilter(reportData.results || [],"result");
    const totalPages = Math.max(1,Math.ceil(visibleResultRows.length / PAGE_SIZE));
    resultPage = Math.min(Math.max(resultPage,1),totalPages);
    const startIndex = (resultPage - 1) * PAGE_SIZE;
    const pageRows = visibleResultRows.slice(startIndex,startIndex + PAGE_SIZE);
    byId("resultCountLabel").textContent = \`\${visibleResultRows.length} result rows · page \${resultPage} of \${totalPages}\`;
    if (!visibleResultRows.length) {
      byId("resultsTableWrap").innerHTML = \`<div class="empty-state">No results match these filters.</div>\`;
      return;
    }
    const pager = pagedTableControls("result",resultPage,totalPages,startIndex,visibleResultRows.length);
    byId("resultsTableWrap").innerHTML = \`\${pager}<table><thead><tr><th>Student</th><th>Batch</th><th>Task</th><th>Status</th><th>Score</th><th>Submitted At</th></tr></thead><tbody>\${pageRows.map(row => \`<tr><td><strong>\${escapeHtml(row.fullName)}</strong><br>\${escapeHtml(row.studentId)}<br>\${escapeHtml(row.email || "")}</td><td>\${escapeHtml(row.batch || "—")}</td><td class="question-cell"><strong>\${escapeHtml(row.taskTitle)}</strong><br>\${escapeHtml(row.question)}</td><td><span class="status-badge \${statusClass(row.status)}">\${escapeHtml(row.status)}</span></td><td>\${escapeHtml(formatNumber(row.latestScore))}</td><td>\${escapeHtml(formatDate(row.latestSubmittedAt))}</td></tr>\`).join("")}</tbody></table>\`;
    const prev = byId("resultPrevPage");
    const next = byId("resultNextPage");
    if (prev) prev.addEventListener("click",() => { resultPage -= 1; renderResultsTable(); byId("resultsTableWrap").scrollIntoView({block:"start"}); });
    if (next) next.addEventListener("click",() => { resultPage += 1; renderResultsTable(); byId("resultsTableWrap").scrollIntoView({block:"start"}); });
  };

  renderWeeklyLeaderboard = function() {
    let {start,end} = currentWeekBounds();
    const active = selectedDashboardAccessPoint();
    const isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
    const selectedBatch = byId("dashboardBatchFilter").value;
    const batchNames = isPrivate
      ? ["Private learners"]
      : (selectedBatch ? [selectedBatch] : (reportData.institutionBatches || []).slice().sort());
    const wrap = byId("weeklyLeaderboard");
    if (!batchNames.length) {
      wrap.innerHTML = \`<div class="line-empty">No batches set up yet for this selection.</div>\`;
      return;
    }

    const scoredRows = filteredDashboardResults().filter(row => {
      if (row.latestScore === null || row.latestScore === undefined || !row.latestSubmittedAt) return false;
      return !Number.isNaN(new Date(row.latestSubmittedAt).getTime());
    });
    let rows = scoredRows.filter(row => {
      const submitted = new Date(row.latestSubmittedAt);
      return submitted >= start && submitted < end;
    });
    let fallback = false;

    if (!rows.length && scoredRows.length) {
      const latestTime = Math.max(...scoredRows.map(row => new Date(row.latestSubmittedAt).getTime()));
      const latest = new Date(latestTime);
      const day = latest.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      start = new Date(latest.getFullYear(),latest.getMonth(),latest.getDate() + mondayOffset);
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      rows = scoredRows.filter(row => {
        const submitted = new Date(row.latestSubmittedAt);
        return submitted >= start && submitted < end;
      });
      fallback = true;
    }

    const endLabelDate = new Date(end.getTime() - 86400000);
    byId("leaderboardWeekLabel").textContent = \`\${fallback ? "Latest week with submissions" : "Top 10 by average score"}, \${start.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – \${endLabelDate.toLocaleDateString(undefined,{month:"short",day:"numeric"})}.\`;

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
        .map(entry => ({fullName:entry.fullName,studentId:entry.studentId,average:entry.scores.reduce((a,b) => a+b,0) / entry.scores.length}))
        .sort((a,b) => b.average - a.average)
        .slice(0,10) : [];
      const body = ranked.length
        ? \`<table style="width:100%;min-width:0;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">#</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Student</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border,#e2e8f0);">Avg Score</th></tr></thead><tbody>\${ranked.map((entry,index) => \`<tr><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">\${index+1}</td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);">\${escapeHtml(entry.fullName)}<br><span class="form-note">\${escapeHtml(entry.studentId)}</span></td><td style="padding:6px 8px;border-bottom:1px solid var(--border,#f1f5f9);text-align:right;font-weight:600;">\${entry.average.toFixed(2)}</td></tr>\`).join("")}</tbody></table>\`
        : \`<div style="padding:24px 0;text-align:center;color:var(--muted,#94a3b8);font-size:13px;border:1px dashed var(--border,#e2e8f0);border-radius:8px;">No submissions yet</div>\`;
      return \`<div style="margin-bottom:16px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;">\${escapeHtml(batchName)}</div>\${body}</div>\`;
    }).join("");
  };

  const replaceClickHandler = (id,handler) => {
    const current = byId(id);
    if (!current || !current.parentNode) return;
    const fresh = current.cloneNode(true);
    current.parentNode.replaceChild(fresh,current);
    fresh.addEventListener("click",handler);
  };
  replaceClickHandler("applyAssignmentFiltersButton",() => { assignmentPage = 1; renderAssignmentsTable(); });
  replaceClickHandler("applyResultFiltersButton",() => { resultPage = 1; renderResultsTable(); });
})();
</script>`;

  if (!html.includes('data-ascent-results-hotfix="2026-08-24.1"')) {
    html = html.replace("</body>", trainerResultsHotfix + "\n</body>");
  }

  html = html.replace(
    'data-ascent-build="2026-08-04.5"',
    'data-ascent-build="2026-08-24.1"'
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
