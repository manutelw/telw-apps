from pathlib import Path
import re

path = Path('ascent/trainer.html')
text = path.read_text(encoding='utf-8')
original = text

# Card labels: keep questions due and average score, replace student-count cards with median/mode.
text = text.replace(
    '<div class="summary-card"><div class="summary-label" id="diagnosticCompletedLabel">Completed</div><div id="diagnosticAttemptedValue" class="summary-value">—</div></div>',
    '<div class="summary-card"><div class="summary-label" id="diagnosticCompletedLabel">Median</div><div id="diagnosticAttemptedValue" class="summary-value">—</div></div>',
    1,
)
text = text.replace(
    '<div class="summary-card"><div class="summary-label">Not Completed</div><div id="diagnosticNotStartedValue" class="summary-value">—</div></div>',
    '<div class="summary-card"><div class="summary-label" id="diagnosticNotStartedLabel">Mode</div><div id="diagnosticNotStartedValue" class="summary-value">—</div></div>',
    1,
)

# Add a short interpretation under the four cards.
needle = '          </div>\n          <div class="dashboard-grid">'
replacement = '          </div>\n          <div id="batchStatsInsight" class="panel-subtitle" style="margin:-7px 0 18px;line-height:1.55;"></div>\n          <div class="dashboard-grid">'
if needle in text and 'id="batchStatsInsight"' not in text:
    text = text.replace(needle, replacement, 1)

# Replace the Custom/Bulk summary calculations. The average values already include
# unanswered due questions as 0 because they come from weeklyBulkMetrics.
old = '''        const questionsReleased = rows.length ? Math.max(...rows.map(row => Number(row.released || 0))) : 0;
        const completed = rows.filter(row => Number(row.released || 0) > 0 && Number(row.answered || 0) >= Number(row.released || 0)).length;
        const notCompleted = Math.max(rows.length - completed, 0);
        const averages = rows.map(row => Number(row.average)).filter(Number.isFinite);
        const averageScore = averages.length ? Math.round((averages.reduce((sum,score) => sum + score,0) / averages.length) * 100) / 100 : null;
        const sample = rows[0];'''
new = '''        const questionsReleased = rows.length ? Math.max(...rows.map(row => Number(row.released || 0))) : 0;
        const completed = rows.filter(row => Number(row.released || 0) > 0 && Number(row.answered || 0) >= Number(row.released || 0)).length;
        const notCompleted = Math.max(rows.length - completed, 0);
        const averages = rows.map(row => Number(row.average)).filter(Number.isFinite).sort((a,b)=>a-b);
        const averageScore = averages.length ? Math.round((averages.reduce((sum,score) => sum + score,0) / averages.length) * 100) / 100 : null;
        const medianScore = averages.length
          ? (averages.length % 2
              ? averages[(averages.length-1)/2]
              : (averages[averages.length/2-1] + averages[averages.length/2]) / 2)
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
if old not in text and 'const medianScore = averages.length' not in text:
    raise SystemExit('Custom metric calculation block not found')
if old in text:
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
        renderDiagnosticPie(completed,notCompleted);
        return;'''
if old_values not in text and 'Batch performance: Average ${meanText}' not in text:
    raise SystemExit('Custom summary value block not found')
if old_values in text:
    text = text.replace(old_values,new_values,1)

# For non-Custom sets restore the generic count labels and clear the Custom insight.
marker = '''      const rows = filteredReleaseProgress();'''
insert = '''      byId("diagnosticCompletedLabel").textContent = "Students Completed";
      if (byId("diagnosticNotStartedLabel")) byId("diagnosticNotStartedLabel").textContent = "Students Not Completed";
      if (byId("batchStatsInsight")) byId("batchStatsInsight").textContent = "";
      const rows = filteredReleaseProgress();'''
if marker in text and insert not in text:
    text = text.replace(marker,insert,1)

# Graph nomenclature requested by the user.
text = text.replace('Completed: <strong>${completed}</strong>', 'No. of Students Completed: <strong>${completed}</strong>')
text = text.replace('Not completed: <strong>${notCompleted}</strong>', 'No. of Students Not Completed: <strong>${notCompleted}</strong>')

text, _ = re.subn(r'data-ascent-build="[^"]+"','data-ascent-build="2026-08-24.22"',text,count=1)

checks = {
    'median_label':'id="diagnosticCompletedLabel">Median<' in text,
    'mode_label':'id="diagnosticNotStartedLabel">Mode<' in text,
    'median_calc':'const medianScore = averages.length' in text,
    'mode_calc':'let modeScore = null, modeCount = 0;' in text,
    'insight':'Batch performance: Average ${meanText}' in text,
    'graph_completed':'No. of Students Completed:' in text,
    'graph_not_completed':'No. of Students Not Completed:' in text,
    'build':'data-ascent-build="2026-08-24.22"' in text,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    raise SystemExit('Patch verification failed: '+', '.join(failed))

if text != original:
    path.write_text(text,encoding='utf-8')
    print('trainer.html patched: median, mode and batch performance insight added')
else:
    print('trainer.html already patched')
