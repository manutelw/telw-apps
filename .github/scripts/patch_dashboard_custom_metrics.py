from pathlib import Path
import re

path = Path('ascent/trainer.html')
text = path.read_text(encoding='utf-8')
original = text

pattern = re.compile(r"    function renderDiagnosticSummary\(\) \{.*?^    \}\n\n    function renderDiagnosticPie", re.MULTILINE | re.DOTALL)
replacement = r'''    function renderDiagnosticSummary() {
      const questionSet = byId("dashboardQuestionSetFilter").value || "DIAGNOSTIC";
      const label = QUESTION_SET_LABELS[questionSet] || "Question Set";
      byId("releaseSectionTitle").textContent = label;
      byId("releaseChartTitle").textContent = `${label} Completion`;

      if (questionSet === "CUSTOM") {
        const active = selectedDashboardAccessPoint();
        const isPrivate = active && active.accessType === "PRIVATE_LEARNERS";
        const selectedBatch = byId("dashboardBatchFilter").value;
        const selectedPrivateStudent = byId("dashboardPrivateFilter").value;
        const students = Array.isArray(reportData.students) ? reportData.students : [];
        const studentByUuid = new Map(students.map(student => [String(student.studentUuid || ""), student]));
        const metrics = Array.isArray(reportData.weeklyBulkMetrics) ? reportData.weeklyBulkMetrics : [];
        const weekNos = Array.from(new Set(metrics.map(metric => Number(metric.weekNo)).filter(Number.isFinite))).sort((a,b)=>a-b);
        const latestWeekNo = weekNos.length ? weekNos[weekNos.length - 1] : null;
        const rows = latestWeekNo === null ? [] : metrics.filter(metric => {
          if (Number(metric.weekNo) !== latestWeekNo) return false;
          const student = studentByUuid.get(String(metric.studentUuid || ""));
          if (!student) return false;
          if (isPrivate && selectedPrivateStudent && String(student.studentUuid || "") !== selectedPrivateStudent) return false;
          if (!isPrivate && selectedBatch && String(student.batch || "") !== selectedBatch) return false;
          return true;
        });

        const questionsReleased = rows.length ? Math.max(...rows.map(row => Number(row.released || 0))) : 0;
        const completed = rows.filter(row => Number(row.released || 0) > 0 && Number(row.answered || 0) >= Number(row.released || 0)).length;
        const notCompleted = Math.max(rows.length - completed, 0);
        const averages = rows.map(row => Number(row.average)).filter(Number.isFinite);
        const averageScore = averages.length ? Math.round((averages.reduce((sum,score) => sum + score,0) / averages.length) * 100) / 100 : null;
        const sample = rows[0];
        const weekText = sample ? ` through Week ${latestWeekNo}` : "";

        byId("diagnosticReleaseLabel").textContent = questionsReleased
          ? `${questionsReleased} Bulk Question${questionsReleased === 1 ? "" : "s"} due${weekText}. Questions released in the current week do not enter these completion figures until the following week.`
          : "No completed Bulk Question week is available yet for this selection.";
        summaryValue("diagnosticQuestionsValue",questionsReleased);
        summaryValue("diagnosticAttemptedValue",completed);
        summaryValue("diagnosticNotStartedValue",notCompleted);
        summaryValue("diagnosticAverageScoreValue",averageScore);
        renderDiagnosticPie(completed,notCompleted);
        return;
      }

      const rows = filteredReleaseProgress();

      if (!rows.length) {
        byId("diagnosticReleaseLabel").textContent = "No questions of this type have been released yet for this selection.";
        summaryValue("diagnosticQuestionsValue",0); summaryValue("diagnosticAttemptedValue",0);
        summaryValue("diagnosticNotStartedValue",0);
        summaryValue("diagnosticAverageScoreValue",null);
        renderDiagnosticPie(0,0);
        return;
      }

      const questionsReleased = rows[0].questionsInRelease || 0;
      const completed = rows.filter(row => row.questionsAnswered >= questionsReleased && questionsReleased > 0).length;
      const notCompleted = rows.length - completed;
      const scored = rows.filter(row => row.questionsAnswered > 0 && row.averageScore !== null && row.averageScore !== undefined);
      const averageScore = scored.length ? Math.round((scored.reduce((sum,row) => sum + Number(row.averageScore),0) / scored.length) * 100) / 100 : null;

      byId("diagnosticReleaseLabel").textContent = questionSet === "DIAGNOSTIC"
        ? `${questionsReleased} question${questionsReleased === 1 ? "" : "s"} currently released. A learner counts as completed only after answering every question in one go — any partial progress counts as not completed.`
        : `${questionsReleased} question${questionsReleased === 1 ? "" : "s"} currently released. A learner counts as completed only after answering every question — partial or no progress both count as not completed.`;
      summaryValue("diagnosticQuestionsValue",questionsReleased);
      summaryValue("diagnosticAttemptedValue",completed);
      summaryValue("diagnosticNotStartedValue",notCompleted);
      summaryValue("diagnosticAverageScoreValue",averageScore);
      renderDiagnosticPie(completed,notCompleted);
    }

    function renderDiagnosticPie'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit('Could not patch renderDiagnosticSummary')
text, _ = re.subn(r'data-ascent-build="[^"]+"', 'data-ascent-build="2026-08-24.19"', text, count=1)
path.write_text(text, encoding='utf-8')
print('Patched Custom dashboard metrics to use latest completed-week Bulk metrics')
