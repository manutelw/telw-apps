from pathlib import Path
import sys

errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

root = Path('.')
trainer = (root / 'ascent' / 'trainer.html').read_text(encoding='utf-8')
summary = (root / 'ascent' / 'trainer-results-summary.js').read_text(encoding='utf-8')

# Trainer portal reporting is part of protected ASCENT core.
for marker, message in [
    ('id="dashboardExportButton"', 'Dashboard Excel download button is missing.'),
    ('id="resultsExportButton"', 'Results Excel download button is missing.'),
    ('id="weeklyLeaderboard"', 'Weekly leaderboard container is missing.'),
    ('id="leaderboardWeekLabel"', 'Leaderboard week label is missing.'),
    ('id="resultsTableWrap"', 'Student Results table container is missing.'),
    ('id="resultBatchFilter"', 'Results batch filter is missing.'),
    ('id="resultTaskFilter"', 'Results task filter is missing.'),
    ('id="resultStatusFilter"', 'Results status filter is missing.'),
    ('async function exportExcel', 'Core Excel export function is missing.'),
    ('function buildWeeklyLeaderboardSheets', 'Weekly leaderboard Excel builder is missing.'),
    ('trainer-results-summary.js', 'Protected Results summary component is not loaded.')
]:
    require(marker in trainer, message)

# Keep Results student-level rather than question-by-question.
for marker, message in [
    ('function aggregateResults', 'Student-level Results aggregation is missing.'),
    ('student/task summaries shown', 'Student-level Results count label is missing.'),
    ('resultVisibleSortControls', 'Visible Results sorting controls are missing.'),
    ('value="batch"', 'Batch sorting option is missing.'),
    ('value="status"', 'Status sorting option is missing.'),
    ('ASCENT_TASK', 'Ascent Task category mapping is missing.'),
    ('SANDEEP_TRAINER_UUID', 'Sandeep-specific Results restriction is missing.'),
    ('rows=rows.filter(function(row){return resultCategory(row)==="ASCENT_TASK";})',
     'Sandeep Results must remain restricted to Ascent Task.')
]:
    require(marker in summary, message)

# Detailed questions may remain in stored/report data, but must not be rendered as Results rows.
require('taskTitle' not in summary.split('wrap.innerHTML=', 1)[-1],
        'Question/task titles must not return to the visible Results rows.')

if errors:
    print('ASCENT trainer integrity check FAILED:')
    for error in errors:
        print(' - ' + error)
    sys.exit(1)

print('ASCENT trainer integrity check passed.')
