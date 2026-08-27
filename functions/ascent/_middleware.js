export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);

  if (!response.ok || !url.pathname.endsWith('/ascent/trainer.html')) {
    return response;
  }

  let html = await response.text();

  const script = `
<script data-ascent-results-task-filter="2026-08-27.1">
(function () {
  const RESULT_TASK_OPTIONS = [
    { value: "", label: "All tasks" },
    { value: "PI", label: "PI" },
    { value: "GD", label: "GD" },
    { value: "LUM", label: "LUM" },
    { value: "JD", label: "JD" },
    { value: "ASCENT_TASK", label: "Ascent Task" }
  ];

  function categoryForResult(row) {
    const questionType = String(row && row.questionType || "").trim().toUpperCase();
    const rubricType = String(row && row.rubricType || "").trim().toUpperCase();
    const taskTitle = String(row && row.taskTitle || "").trim().toUpperCase();

    if (taskTitle.includes("JD INTERVIEW MAPPER") || taskTitle.startsWith("JD ") || taskTitle.includes("· JD")) return "JD";
    if (questionType === "PI" || rubricType === "PI") return "PI";
    if (questionType === "GD" || rubricType === "GD") return "GD";
    if (questionType === "LUM") return "LUM";
    if (rubricType === "MANAGERIAL_COMMUNICATION" && taskTitle.startsWith("LUM ")) return "LUM";
    return "ASCENT_TASK";
  }

  function enforceResultsTaskOptions() {
    const select = document.getElementById("resultTaskFilter");
    if (!select) return;

    const current = select.value;
    const expected = RESULT_TASK_OPTIONS.map(item => item.value + "|" + item.label).join("||");
    const actual = Array.from(select.options).map(option => option.value + "|" + option.textContent).join("||");
    if (actual === expected) return;

    select.innerHTML = "";
    RESULT_TASK_OPTIONS.forEach(item => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.value = RESULT_TASK_OPTIONS.some(item => item.value === current) ? current : "";
  }

  if (typeof window.resultFilter === "function") {
    window.resultFilter = function (rows, prefix) {
      const batch = document.getElementById(prefix + "BatchFilter")?.value || "";
      const student = document.getElementById(prefix + "StudentFilter")?.value || "";
      const task = document.getElementById(prefix + "TaskFilter")?.value || "";
      const status = document.getElementById(prefix + "StatusFilter")?.value || "";
      const from = prefix === "result" ? (document.getElementById("resultDateFrom")?.value || "") : "";
      const to = prefix === "result" ? (document.getElementById("resultDateTo")?.value || "") : "";

      return (rows || []).filter(row => {
        if (batch && String(row.batch || "") !== batch) return false;
        if (student && row.studentUuid !== student) return false;
        if (task) {
          if (prefix === "result") {
            if (categoryForResult(row) !== task) return false;
          } else if (row.taskUuid !== task) {
            return false;
          }
        }
        if (status && row.status !== status) return false;
        const dateValue = row.latestSubmittedAt || row.availableAt;
        if (from && dateValue && new Date(dateValue) < new Date(from + "T00:00:00")) return false;
        if (to && dateValue && new Date(dateValue) > new Date(to + "T23:59:59")) return false;
        return true;
      });
    };
  }

  const originalPopulateControls = typeof window.populateControls === "function" ? window.populateControls : null;
  if (originalPopulateControls) {
    window.populateControls = function () {
      const result = originalPopulateControls.apply(this, arguments);
      enforceResultsTaskOptions();
      return result;
    };
  }

  enforceResultsTaskOptions();
  window.setTimeout(enforceResultsTaskOptions, 250);
  window.setTimeout(enforceResultsTaskOptions, 1000);

  const observer = new MutationObserver(function () {
    enforceResultsTaskOptions();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
</script>`;

  html = html.replace(/<script data-ascent-results-task-filter="[^"]+">[\s\S]*?<\/script>/, "");
  html = html.replace('</body>', script + '\n</body>');

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=UTF-8');
  headers.set('cache-control', 'no-store, max-age=0');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
