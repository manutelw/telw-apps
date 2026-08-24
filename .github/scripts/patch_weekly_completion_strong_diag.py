from pathlib import Path

path = Path('ascent/weekly-completion.html')
text = path.read_text(encoding='utf-8')
original = text

old_panel = '''        <section class="panel">
          <h3>Red — Zero Completion</h3>
          <div class="panel-subtitle">Students who answered none of the released Bulk Questions by the end of the completed week.</div>
          <div id="redTable"></div>
        </section>
      </div>'''
new_panel = '''        <section class="panel">
          <h3>Red — Zero Completion</h3>
          <div class="panel-subtitle">Students who answered none of the released Bulk Questions by the end of the completed week. Students with a Diagnostic score of 8.25/10 or above are moved to the separate list below.</div>
          <div id="redTable"></div>
        </section>

        <section class="panel">
          <h3>Strong Diagnostic Score, but Incomplete Weekly Work</h3>
          <div class="panel-subtitle">Students moved out of Amber/Red because their overall Diagnostic score is 8.25/10 or above. Their weekly completion status is still shown here.</div>
          <div id="strongDiagnosticTable"></div>
        </section>
      </div>'''
if 'id="strongDiagnosticTable"' not in text:
    if old_panel not in text:
        raise SystemExit('Could not locate Red panel block')
    text = text.replace(old_panel,new_panel,1)

old_amber_sub = '''          <div class="panel-subtitle">Students who answered at least one, but not all, released Bulk Questions by the end of the completed week.</div>'''
new_amber_sub = '''          <div class="panel-subtitle">Students who answered at least one, but not all, released Bulk Questions by the end of the completed week. Students with a Diagnostic score of 8.25/10 or above are moved to the separate list below.</div>'''
if old_amber_sub in text:
    text = text.replace(old_amber_sub,new_amber_sub,1)

marker = '''  function makeTable(rows, studentMap, statusClass) {'''
helpers = '''  function diagnosticScoreMap() {
    const results = Array.isArray(reportData?.results) ? reportData.results : [];
    const grouped = new Map();
    results.forEach(row => {
      if (String(row.questionType || "").toUpperCase() !== "DIAGNOSTIC") return;
      const studentUuid = String(row.studentUuid || "");
      const score = Number(row.latestScore);
      if (!studentUuid || !Number.isFinite(score)) return;
      if (!grouped.has(studentUuid)) grouped.set(studentUuid,[]);
      grouped.get(studentUuid).push(score);
    });
    const scores = new Map();
    grouped.forEach((values,studentUuid) => {
      if (!values.length) return;
      scores.set(studentUuid, values.reduce((sum,n)=>sum+n,0) / values.length);
    });
    return scores;
  }

  function makeStrongDiagnosticTable(rows, studentMap, diagnosticScores) {
    if (!rows.length) return `<div class="empty">No incomplete students currently have a Diagnostic score of 8.25/10 or above.</div>`;
    const ordered = rows.slice().sort((a,b) => {
      const da = Number(diagnosticScores.get(String(a.studentUuid || "")) || 0);
      const db = Number(diagnosticScores.get(String(b.studentUuid || "")) || 0);
      if (db !== da) return db-da;
      const sa = studentMap.get(String(a.studentUuid || "")) || {};
      const sb = studentMap.get(String(b.studentUuid || "")) || {};
      return String(sa.fullName || "").localeCompare(String(sb.fullName || ""));
    });
    return `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Roll No.</th><th>Diagnostic Score</th><th>Weekly Progress</th><th>Weekly Score</th><th>Email</th><th>Weekly Status</th></tr></thead><tbody>${ordered.map(row => {
      const student = studentMap.get(String(row.studentUuid || "")) || {};
      const diagnostic = Number(diagnosticScores.get(String(row.studentUuid || "")));
      const weekly = Number(row.average);
      const status = Number(row.answered || 0) === 0 ? "ZERO" : "PARTIAL";
      const cls = status === "ZERO" ? "red" : "amber";
      return `<tr>
        <td><strong>${escapeHtml(student.fullName || "—")}</strong></td>
        <td>${escapeHtml(student.studentId || "—")}</td>
        <td><strong>${diagnostic.toFixed(2)}/10</strong></td>
        <td>${Number(row.answered || 0)} / ${Number(row.released || 0)}</td>
        <td>${Number.isFinite(weekly) ? weekly.toFixed(2) : "—"}</td>
        <td>${escapeHtml(student.email || "—")}</td>
        <td><span class="status-pill ${cls}">${status}</span></td>
      </tr>`;
    }).join("")}</tbody></table></div>`;
  }

'''
if 'function diagnosticScoreMap()' not in text:
    if marker not in text:
        raise SystemExit('Could not locate makeTable function')
    text = text.replace(marker,helpers+marker,1)

old_render = '''    const partial = rows.filter(r => Number(r.answered || 0) > 0 && Number(r.answered || 0) < Number(r.released || 0));
    const zero = rows.filter(r => Number(r.answered || 0) === 0);
    const averages = rows.map(r => Number(r.average)).filter(Number.isFinite);'''
new_render = '''    const partial = rows.filter(r => Number(r.answered || 0) > 0 && Number(r.answered || 0) < Number(r.released || 0));
    const zero = rows.filter(r => Number(r.answered || 0) === 0);
    const diagnosticScores = diagnosticScoreMap();
    const strongIncomplete = [...partial,...zero].filter(r => Number(diagnosticScores.get(String(r.studentUuid || ""))) >= 8.25);
    const strongIds = new Set(strongIncomplete.map(r => String(r.studentUuid || "")));
    const actionPartial = partial.filter(r => !strongIds.has(String(r.studentUuid || "")));
    const actionZero = zero.filter(r => !strongIds.has(String(r.studentUuid || "")));
    const averages = rows.map(r => Number(r.average)).filter(Number.isFinite);'''
if old_render in text:
    text = text.replace(old_render,new_render,1)
elif 'const strongIncomplete = [...partial,...zero]' not in text:
    raise SystemExit('Could not locate completion split block')

old_tables = '''    byId("amberTable").innerHTML = makeTable(partial,studentMap,"amber");
    byId("redTable").innerHTML = makeTable(zero,studentMap,"red");'''
new_tables = '''    byId("amberTable").innerHTML = makeTable(actionPartial,studentMap,"amber");
    byId("redTable").innerHTML = makeTable(actionZero,studentMap,"red");
    byId("strongDiagnosticTable").innerHTML = makeStrongDiagnosticTable(strongIncomplete,studentMap,diagnosticScores);'''
if old_tables in text:
    text = text.replace(old_tables,new_tables,1)
elif 'makeStrongDiagnosticTable(strongIncomplete' not in text:
    raise SystemExit('Could not locate Amber/Red render calls')

checks = [
    'id="strongDiagnosticTable"',
    'function diagnosticScoreMap()',
    '>= 8.25',
    'const actionPartial',
    'const actionZero',
    'makeStrongDiagnosticTable(strongIncomplete'
]
missing = [item for item in checks if item not in text]
if missing:
    raise SystemExit('Patch verification failed: ' + ', '.join(missing))

if text != original:
    path.write_text(text,encoding='utf-8')
    print('weekly-completion.html patched: strong Diagnostic incomplete students moved to third list')
else:
    print('weekly-completion.html already patched')
