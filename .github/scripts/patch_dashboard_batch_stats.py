from pathlib import Path
import re

path = Path('ascent/trainer.html')
text = path.read_text(encoding='utf-8')

text, n1 = re.subn(
    r'<div class="summary-card"><div class="summary-label" id="diagnosticCompletedLabel">(?:Completed|Students Completed|Median)</div><div id="diagnosticAttemptedValue" class="summary-value">—</div></div>',
    '<div class="summary-card"><div class="summary-label" id="diagnosticCompletedLabel">Median</div><div id="diagnosticAttemptedValue" class="summary-value">—</div></div>',
    text,
    count=1,
)
text, n2 = re.subn(
    r'<div class="summary-card"><div class="summary-label"(?: id="diagnosticNotStartedLabel")?>(?:Not Completed|Students Not Completed|Mode)</div><div id="diagnosticNotStartedValue" class="summary-value">—</div></div>',
    '<div class="summary-card"><div class="summary-label" id="diagnosticNotStartedLabel">Mode</div><div id="diagnosticNotStartedValue" class="summary-value">—</div></div>',
    text,
    count=1,
)
if n1 != 1 or n2 != 1:
    raise SystemExit('Could not locate dashboard statistic cards')

needle = '          </div>\n          <div class="dashboard-grid">'
replacement = '          </div>\n          <div id="batchStatsInsight" class="panel-subtitle" style="margin:-7px 0 18px;line-height:1.55;"></div>\n          <div class="dashboard-grid">'
if needle in text and 'id="batchStatsInsight"' not in text:
    text = text.replace(needle, replacement, 1)

old = '''        const questionsReleased = rows.length ? Math.max(...rows.map(row => Number(row.released || 0))) : 0;
        const completed = rows.filter(row => Number(row.released || 0) > 0 && Number(row.answered || 0) >= Number(row.released || 0)).length;
        const notCompleted = Math.max(rows.length - completed, 0);
        const averages = rows.map(row => Number(row.average)).filter(Number.isFinite);
        const averageScore = averages.length ? Math.round((averages.reduce((sum,score) => sum + score,0) / averages.length) * 100) / 100 : null;
        const sample = rows[0];'''
new = '''        const questionsReleased = rows.length ? Math.max(...rows.map(row => Number(row.released || 0))) : 0;
        const completed = rows.filter(row => Number(row.released || 0) > 0 && Number(row.answered || 0) >= Number(row.released || 0)).length;
        const partlyCompleted = rows.filter(row => Number(row.answered || 0) > 0 && Number(row.answered || 0) < Number(row.released || 0)).length;
        const zeroCompleted = rows.filter(row => Number(row.answered || 0) === 0).length;
        const notCompleted = partlyCompleted + zeroCompleted;
        const averages = rows.map(row => Number(row.average)).filter(Number.isFinite).sort((a,b)=>a-b);
        const averageScore = averages.length ? Math.round((averages.reduce((sum,score) => sum + score,0) / averages.length) * 100) / 100 : null;
        const medianScore = averages.length
          ? (averages.length % 2
              ? averages[(averages.length - 1) / 2]
              : (averages[averages.length / 2 - 1] + averages[averages.length / 2]) / 2)
          : null;
        const frequency = new Map();
        averages.forEach(score => {
          const key = Number(score).toFixed(2);
          frequency.set(key,(frequency.get(key)||0)+1);
        });
        let modeScore = null, modeCount = 0;
        Array.from(frequency.entries()).sort((a,b)=>Number(a[0])-Number(b[0])).forEach(([key,count])=>{
          if (count > modeCount) { modeCount = count; modeScore = Number(key); }
        });
        const sample = rows[0];'''
if old not in text:
    raise SystemExit('Custom metric calculation block not found')
text = text.replace(old,new,1)

old_values = '''        summaryValue("diagnosticQuestionsValue",questionsReleased);
        summaryValue("diagnosticAttemptedValue",completed);
        summaryValue("diagnosticNotStartedValue",notCompleted);
        summaryValue("diagnosticAverageScoreValue",averageScore);
        renderDiagnosticPie(completed,notCompleted);
        return;'''
new_values = '''        summaryValue("diagnosticQuestionsValue",questionsReleased);
        byId("diagnosticCompletedLabel").textContent = "Median";
        if (byId("diagnosticNotStartedLabel")) byId("diagnosticNotStartedLabel").textContent = "Mode";
        summaryValue("diagnosticAttemptedValue",medianScore === null ? null : Math.round(medianScore*100)/100);
        summaryValue("diagnosticNotStartedValue",modeScore === null ? null : Math.round(modeScore*100)/100);
        summaryValue("diagnosticAverageScoreValue",averageScore);
        const insight = byId("batchStatsInsight");
        if (insight) {
          if (!averages.length) {
            insight.textContent = "No completed-week Bulk Question scores are available yet.";
          } else {
            const meanText = Number(averageScore).toFixed(2);
            const medianText = Number(medianScore).toFixed(2);
            const modeText = Number(modeScore).toFixed(2);
            let interpretation = "The mean and median are close, so the middle of the batch is broadly consistent with the overall average.";
            if (Number(modeScore) === 0) interpretation += " The mode of 0 shows that non-submission is still the single most common score outcome and is pulling overall performance down.";
            else if (averageScore < medianScore) interpretation += " The mean is below the median, which suggests lower scores are pulling the overall average down.";
            else if (averageScore > medianScore) interpretation += " The mean is above the median, which suggests stronger scores at the top are lifting the overall average.";
            insight.textContent = `Batch performance: Average ${meanText}, Median ${medianText}, Mode ${modeText}. ${interpretation}`;
          }
        }
        renderBulkCompletionPie(completed,partlyCompleted,zeroCompleted);
        return;'''
if old_values not in text:
    raise SystemExit('Custom summary value block not found')
text = text.replace(old_values,new_values,1)

if 'function renderBulkCompletionPie(' not in text:
    marker = '    function renderDiagnosticPie(completed,notCompleted) {'
    func = '''    function renderBulkCompletionPie(fullyCompleted,partlyCompleted,zeroCompleted) {
      const total = fullyCompleted + partlyCompleted + zeroCompleted;
      const wrap = byId("diagnosticPieChart");
      if (!total) { wrap.innerHTML = `<div class="line-empty">No assignments yet.</div>`; return; }
      const fullPct = (fullyCompleted / total) * 100;
      const partialPct = (partlyCompleted / total) * 100;
      const fullEnd = fullPct;
      const partialEnd = fullPct + partialPct;
      const pieStyle = `background:conic-gradient(#2e8b68 0% ${fullEnd}%, #d48c24 ${fullEnd}% ${partialEnd}%, #9eafbd ${partialEnd}% 100%);width:160px;height:160px;border-radius:50%;margin:0 auto;`;
      wrap.innerHTML = `<div style="${pieStyle}"></div><div class="chart-legend" style="justify-content:center;margin-top:12px;"><span><i class="legend-dot completed"></i>Students fully completed: <strong>${fullyCompleted}</strong></span><span><i class="legend-dot not-attempted"></i>Students partly completed: <strong>${partlyCompleted}</strong></span><span><i class="legend-dot other"></i>Students with 0 completion: <strong>${zeroCompleted}</strong></span></div>`;
    }

'''
    if marker not in text:
        raise SystemExit('renderDiagnosticPie function not found')
    text = text.replace(marker,func+marker,1)

marker = '''      const rows = filteredReleaseProgress();'''
insert = '''      byId("diagnosticCompletedLabel").textContent = "Students Completed";
      if (byId("diagnosticNotStartedLabel")) byId("diagnosticNotStartedLabel").textContent = "Students Not Completed";
      if (byId("batchStatsInsight")) byId("batchStatsInsight").textContent = "";
      const rows = filteredReleaseProgress();'''
if marker in text and insert not in text:
    text = text.replace(marker,insert,1)

text, _ = re.subn(r'data-ascent-build="[^"]+"','data-ascent-build="2026-08-24.23"',text,count=1)

checks = {
    'median_label':'id="diagnosticCompletedLabel">Median<' in text,
    'mode_label':'id="diagnosticNotStartedLabel">Mode<' in text,
    'median_calc':'const medianScore = averages.length' in text,
    'mode_calc':'let modeScore = null, modeCount = 0;' in text,
    'three_way_counts':'const partlyCompleted = rows.filter' in text and 'const zeroCompleted = rows.filter' in text,
    'three_way_chart':'function renderBulkCompletionPie(' in text and 'Students fully completed:' in text and 'Students partly completed:' in text and 'Students with 0 completion:' in text,
    'custom_call':'renderBulkCompletionPie(completed,partlyCompleted,zeroCompleted);' in text,
    'build':'data-ascent-build="2026-08-24.23"' in text,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    raise SystemExit('Patch verification failed: '+', '.join(failed))

path.write_text(text,encoding='utf-8')
print('trainer.html patched: mean, median, mode and three-way Bulk completion graph added')
