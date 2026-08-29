(() => {
  "use strict";

  const stageTitles = {
    analysis: "JD Analysis",
    research: "Company Research",
    briefing: "Student Briefing",
  };

  function openCapture() {
    const uploadPanel = document.getElementById("uploadPanel");
    if (uploadPanel) {
      uploadPanel.classList.remove("hidden");
      uploadPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function openStage(target) {
    if (target === "capture") {
      openCapture();
      return;
    }

    const resultsSection = document.getElementById("resultsSection");
    const reportContent = document.getElementById("reportContent");
    const resultsTitle = document.getElementById("resultsTitle");
    const resultsMeta = document.getElementById("resultsMeta");
    const tab = document.querySelector(`.tab[data-tab="${target}"]`);

    if (!resultsSection || !reportContent || !tab) return;

    // Let app.js update its own activeTab when a report exists.
    tab.click();

    const hasGeneratedReport =
      !document.getElementById("workflowStagePlaceholder") &&
      Boolean(resultsMeta?.textContent?.trim()) &&
      Boolean(reportContent.innerHTML.trim());

    if (!hasGeneratedReport) {
      resultsSection.classList.remove("hidden");
      if (resultsTitle) resultsTitle.textContent = stageTitles[target] || "Briefing Stage";
      if (resultsMeta) resultsMeta.textContent = "";
      reportContent.innerHTML = `
        <section id="workflowStagePlaceholder" class="content-card" style="text-align:center;padding:42px 24px">
          <p class="section-label">${target === "analysis" ? "STAGE 2" : target === "research" ? "STAGE 3" : "STAGE 4"}</p>
          <h2>${stageTitles[target] || "Briefing Stage"}</h2>
          <p class="muted">Generate a JD briefing to populate this page. You can return to Capture at any time.</p>
          <button type="button" id="workflowBackToCapture" class="primary-button compact">Go to Capture</button>
        </section>`;
      document.getElementById("workflowBackToCapture")?.addEventListener("click", openCapture);
    }

    document.querySelectorAll(".tab").forEach((item) => {
      item.classList.toggle("active", item.dataset.tab === target);
    });
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cardFromEvent(event) {
    return event.target instanceof Element ? event.target.closest("[data-workflow-target]") : null;
  }

  // Capture phase supersedes the older fallback handler in index.html.
  document.addEventListener("click", (event) => {
    const card = cardFromEvent(event);
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openStage(card.dataset.workflowTarget || "capture");
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = cardFromEvent(event);
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openStage(card.dataset.workflowTarget || "capture");
  }, true);
})();
