(() => {
  "use strict";

  const config = window.JD_BRIEFING_CONFIG || {};
  const form = document.getElementById("briefingForm");
  const fileInput = document.getElementById("jdFile");
  const dropzone = document.getElementById("dropzone");
  const filePrompt = document.getElementById("filePrompt");
  const fileHelp = document.getElementById("fileHelp");
  const optionalContext = document.getElementById("optionalContext");
  const appPassword = document.getElementById("appPassword");
  const generateButton = document.getElementById("generateButton");
  const clearButton = document.getElementById("clearButton");
  const uploadPanel = document.getElementById("uploadPanel");
  const progressPanel = document.getElementById("progressPanel");
  const progressTitle = document.getElementById("progressTitle");
  const progressMessage = document.getElementById("progressMessage");
  const errorPanel = document.getElementById("errorPanel");
  const errorMessage = document.getElementById("errorMessage");
  const resultsSection = document.getElementById("resultsSection");
  const resultsTitle = document.getElementById("resultsTitle");
  const resultsMeta = document.getElementById("resultsMeta");
  const reportContent = document.getElementById("reportContent");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const downloadWordButton = document.getElementById("downloadWordButton");
  const downloadJsonButton = document.getElementById("downloadJsonButton");
  const printButton = document.getElementById("printButton");
  const newBriefingButton = document.getElementById("newBriefingButton");

  let currentEnvelope = null;
  let activeTab = "overview";
  let progressTimer = null;

  const progressStages = [
    ["Reading the Job Description…", "The system is extracting the company, role and recruitment details."],
    ["Analysing the role…", "Responsibilities, skills, keywords and expected student evidence are being mapped."],
    ["Researching the company…", "Current official and reputable web sources are being checked."],
    ["Preparing the standard briefing…", "The student-facing pre-reading pack and validation flags are being assembled."],
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function displayValue(value) {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Not stated";
    const text = String(value ?? "").trim();
    return text || "Not stated";
  }

  function slugify(value) {
    return String(value || "briefing")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "briefing";
  }

  function arrayOrEmpty(value) {
    return Array.isArray(value) ? value : [];
  }

  function renderList(items, emptyText = "No items identified.") {
    const values = arrayOrEmpty(items).filter((item) => String(item ?? "").trim());
    if (!values.length) return `<p class="muted">${escapeHtml(emptyText)}</p>`;
    return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function renderTags(items) {
    const values = arrayOrEmpty(items).filter(Boolean);
    if (!values.length) return `<p class="muted">No keywords identified.</p>`;
    return values.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("");
  }

  function metricCard(label, value) {
    return `<div class="metric-card"><small>${escapeHtml(label)}</small><strong>${escapeHtml(displayValue(value))}</strong></div>`;
  }

  function contentCard(title, body) {
    return `<article class="content-card"><h3>${escapeHtml(title)}</h3>${body}</article>`;
  }

  function renderEvidenceTable(rows) {
    const values = arrayOrEmpty(rows);
    if (!values.length) return `<p class="muted">No evidence map was generated.</p>`;
    return `
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>JD requirement</th><th>Evidence the student should show</th></tr></thead>
          <tbody>
            ${values.map((row) => `
              <tr>
                <td>${escapeHtml(row?.requirement)}</td>
                <td>${escapeHtml(row?.evidence_student_should_show)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function renderDevelopments(rows) {
    const values = arrayOrEmpty(rows);
    if (!values.length) return `<p class="muted">No recent developments were identified.</p>`;
    return `
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Development</th><th>Why it matters to students</th><th>Source</th></tr></thead>
          <tbody>
            ${values.map((row) => {
              const url = safeUrl(row?.source_url);
              return `<tr>
                <td>${escapeHtml(row?.date)}</td>
                <td>${escapeHtml(row?.development)}</td>
                <td>${escapeHtml(row?.relevance_to_students)}</td>
                <td>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open source</a>` : "Not supplied"}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function renderOverview(report) {
    const info = report.recruitment_information || {};
    const analysis = report.jd_analysis || {};
    const briefing = report.standardised_briefing || {};
    const missing = arrayOrEmpty(info.missing_information);

    return `
      <section class="summary-grid">
        ${metricCard("Company", info.company_name)}
        ${metricCard("Role", info.role_title)}
        ${metricCard("Location", info.location)}
        ${metricCard("Compensation", info.compensation)}
      </section>

      <div class="two-column" style="margin-top:16px">
        ${contentCard("Executive summary", `<p>${escapeHtml(briefing.executive_summary)}</p>`)}
        ${contentCard("Role purpose", `<p>${escapeHtml(analysis.role_purpose)}</p>`)}
      </div>

      <div class="two-column">
        ${contentCard("Eligibility", renderList(info.eligibility, "Not stated in the JD."))}
        ${contentCard("Recruitment stages", renderList(info.recruitment_stages, "Not stated in the JD."))}
      </div>

      ${contentCard("Dates and instructions", `
        <div class="three-column">
          ${metricCard("Application deadline", info.application_deadline)}
          ${metricCard("Interview date", info.interview_date)}
          ${metricCard("Reading time", briefing.reading_time)}
        </div>
        <h4>Recruiter instructions</h4>
        ${renderList(info.recruiter_instructions, "No additional recruiter instructions were stated.")}
      `)}

      ${missing.length
        ? `<div class="callout"><strong>L&amp;D must obtain or verify:</strong>${renderList(missing)}</div>`
        : `<div class="callout success"><strong>No missing recruitment fields were flagged.</strong></div>`}
    `;
  }

  function renderAnalysis(report) {
    const analysis = report.jd_analysis || {};
    return `
      ${contentCard("Role purpose", `<p>${escapeHtml(analysis.role_purpose)}</p>`)}
      <div class="two-column">
        ${contentCard("Key deliverables", renderList(analysis.key_deliverables))}
        ${contentCard("Responsibilities", renderList(analysis.responsibilities))}
      </div>
      <div class="two-column">
        ${contentCard("Must-have skills", renderList(analysis.must_have_skills))}
        ${contentCard("Good-to-have skills", renderList(analysis.good_to_have_skills))}
      </div>
      <div class="three-column">
        ${contentCard("Qualifications", renderList(analysis.qualifications))}
        ${contentCard("Technical knowledge", renderList(analysis.technical_knowledge))}
        ${contentCard("Behavioural qualities", renderList(analysis.behavioural_qualities))}
      </div>
      ${contentCard("JD keywords", renderTags(analysis.jd_keywords))}
      ${contentCard("Likely interview areas", renderList(analysis.likely_interview_areas))}
      ${contentCard("Requirement-to-evidence map", renderEvidenceTable(analysis.evidence_map))}
    `;
  }

  function renderResearch(report) {
    const research = report.company_research || {};
    return `
      ${contentCard("Company at a glance", `<p>${escapeHtml(research.company_at_a_glance)}</p>`)}
      <div class="two-column">
        ${contentCard("Business model", `<p>${escapeHtml(research.business_model)}</p>`)}
        ${contentCard("Industry", `<p>${escapeHtml(research.industry)}</p>`)}
      </div>
      <div class="two-column">
        ${contentCard("Products and services", renderList(research.products_and_services))}
        ${contentCard("Customer segments", renderList(research.customer_segments))}
      </div>
      <div class="two-column">
        ${contentCard("Competitors", renderList(research.competitors))}
        ${contentCard("Competitive position", `<p>${escapeHtml(research.competitive_position)}</p>`)}
      </div>
      ${contentCard("Recent developments", renderDevelopments(research.recent_developments))}
      <div class="two-column">
        ${contentCard("Hiring context", `<p>${escapeHtml(research.hiring_context)}</p>`)}
        ${contentCard("Role relevance", `<p>${escapeHtml(research.role_relevance)}</p>`)}
      </div>
    `;
  }

  function renderBriefing(report) {
    const briefing = report.standardised_briefing || {};
    return `
      <section class="briefing-cover">
        <p class="section-label">MANDATORY PRE-READING BEFORE THE JD DUGOUT</p>
        <h2>${escapeHtml(briefing.title)}</h2>
        <p>${escapeHtml(briefing.executive_summary)}</p>
        <strong>Estimated reading time: ${escapeHtml(displayValue(briefing.reading_time))}</strong>
      </section>

      ${contentCard("1. Company at a glance", `<p>${escapeHtml(briefing.company_at_a_glance)}</p>`)}
      ${contentCard("2. How the company makes money", `<p>${escapeHtml(briefing.how_the_company_makes_money)}</p>`)}
      <div class="two-column">
        ${contentCard("3. What the company sells", renderList(briefing.what_the_company_sells))}
        ${contentCard("4. Who its customers are", renderList(briefing.who_its_customers_are))}
      </div>
      ${contentCard("5. Industry and competitors", `<p>${escapeHtml(briefing.industry_and_competitors)}</p>`)}
      ${contentCard("6. Recent developments that matter", renderList(briefing.recent_developments_that_matter))}
      ${contentCard("7. Why the company may be hiring", `<p>${escapeHtml(briefing.why_the_company_may_be_hiring)}</p>`)}
      ${contentCard("8. What this role does", `<p>${escapeHtml(briefing.what_this_role_does)}</p>`)}
      <div class="two-column">
        ${contentCard("9. What the recruiter is likely to look for", renderList(briefing.recruiter_priorities))}
        ${contentCard("10. Questions students should prepare", renderList(briefing.questions_students_should_prepare))}
      </div>
      <div class="callout"><strong>Validation note:</strong> ${escapeHtml(briefing.disclaimer)}</div>
    `;
  }

  function collectSources(envelope) {
    const reportSources = arrayOrEmpty(envelope?.report?.standardised_briefing?.source_list).map((source) => ({
      title: source?.title || source?.url || "Source",
      publisher: source?.publisher || "",
      date: source?.date || "",
      url: source?.url || "",
      source_type: "briefing",
    }));
    const apiSources = arrayOrEmpty(envelope?.api_sources).map((source) => ({
      title: source?.title || source?.url || "Web source",
      publisher: "",
      date: "",
      url: source?.url || "",
      source_type: source?.source_type || "web",
    }));

    const unique = new Map();
    [...reportSources, ...apiSources].forEach((source) => {
      const url = safeUrl(source.url);
      if (url && !unique.has(url)) unique.set(url, { ...source, url });
    });
    return [...unique.values()];
  }

  function renderSources(envelope) {
    const report = envelope.report || {};
    const flags = arrayOrEmpty(report?.standardised_briefing?.validation_flags);
    const sources = collectSources(envelope);
    const confidence = report?.meta?.confidence_note || "No confidence note supplied.";

    return `
      ${contentCard("Confidence note", `<p>${escapeHtml(confidence)}</p>`)}
      ${contentCard("Validation flags", flags.length ? renderList(flags) : `<div class="callout success">No specific validation flags were generated. L&amp;D should still perform the final factual check.</div>`)}
      ${contentCard("Research sources", sources.length ? `
        <ol class="source-list">
          ${sources.map((source) => `
            <li>
              <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a>
              <span class="source-meta">${escapeHtml([source.publisher, source.date].filter(Boolean).join(" · ") || source.source_type)}</span>
            </li>
          `).join("")}
        </ol>` : `<p class="muted">No source URLs were returned. Do not publish this briefing until sources are added and checked.</p>`)}
      ${contentCard("Technical record", `
        <div class="three-column">
          ${metricCard("Model", envelope.model || "Not supplied")}
          ${metricCard("Response ID", envelope.response_id || "Not supplied")}
          ${metricCard("Generated", report?.meta?.generated_at || "Not supplied")}
        </div>
      `)}
    `;
  }

  function renderActiveTab() {
    if (!currentEnvelope?.report) return;
    const report = currentEnvelope.report;
    const renderers = {
      overview: () => renderOverview(report),
      analysis: () => renderAnalysis(report),
      research: () => renderResearch(report),
      briefing: () => renderBriefing(report),
      sources: () => renderSources(currentEnvelope),
    };
    reportContent.innerHTML = (renderers[activeTab] || renderers.overview)();
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === activeTab));
  }

  function setSelectedFile(file) {
    if (!file) {
      filePrompt.textContent = "Choose or drop the JD here";
      fileHelp.textContent = "PDF, Word, RTF, ODT, HTML, Markdown or text · Maximum 15 MB";
      dropzone.classList.remove("has-file");
      return;
    }
    filePrompt.textContent = file.name;
    fileHelp.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to analyse`;
    dropzone.classList.add("has-file");
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorPanel.classList.remove("hidden");
  }

  function hideError() {
    errorPanel.classList.add("hidden");
    errorMessage.textContent = "";
  }

  function startProgress() {
    let stageIndex = 0;
    progressPanel.classList.remove("hidden");
    progressTitle.textContent = progressStages[0][0];
    progressMessage.textContent = progressStages[0][1];
    progressTimer = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, progressStages.length - 1);
      progressTitle.textContent = progressStages[stageIndex][0];
      progressMessage.textContent = progressStages[stageIndex][1];
    }, 7000);
  }

  function stopProgress() {
    if (progressTimer) window.clearInterval(progressTimer);
    progressTimer = null;
    progressPanel.classList.add("hidden");
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.includes(",") ? result.split(",")[1] : result);
      };
      reader.onerror = () => reject(new Error("The selected file could not be read."));
      reader.readAsDataURL(file);
    });
  }

  async function submitBriefing(event) {
    event.preventDefault();
    hideError();
    resultsSection.classList.add("hidden");

    const functionUrl = String(config.functionUrl || "").trim();
    if (!functionUrl || functionUrl.includes("PASTE_YOUR")) {
      showError("Open web/config.js and paste the deployed Supabase Edge Function URL first.");
      return;
    }

    const file = fileInput.files?.[0];
    if (!file) {
      showError("Choose a Job Description file.");
      return;
    }

    const maxFileMb = Number(config.maxFileMb || 15);
    if (file.size > maxFileMb * 1024 * 1024) {
      showError(`The file is larger than ${maxFileMb} MB.`);
      return;
    }

    generateButton.disabled = true;
    generateButton.textContent = "Generating…";
    startProgress();

    try {
      const fileBase64 = await fileToBase64(file);
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": appPassword.value,
        },
        body: JSON.stringify({
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          file_base64: fileBase64,
          optional_context: optionalContext.value.trim(),
        }),
      });

      const responseText = await response.text();
      let payload;
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { error: responseText || "The server returned an unreadable response." };
      }

      if (!response.ok) {
        throw new Error(payload?.error || `The server returned status ${response.status}.`);
      }
      if (!payload?.report) {
        throw new Error("The server returned no briefing report.");
      }

      currentEnvelope = payload;
      activeTab = "overview";
      const report = payload.report;
      resultsTitle.textContent = report?.standardised_briefing?.title || "Company Briefing";
      resultsMeta.textContent = [
        report?.meta?.original_filename,
        report?.meta?.generated_at,
      ].filter(Boolean).join(" · ");
      renderActiveTab();
      resultsSection.classList.remove("hidden");
      uploadPanel.classList.add("hidden");
      window.scrollTo({ top: resultsSection.offsetTop - 20, behavior: "smooth" });
    } catch (error) {
      showError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      stopProgress();
      generateButton.disabled = false;
      generateButton.textContent = "Generate full briefing";
    }
  }

  function resetForm() {
    currentEnvelope = null;
    activeTab = "overview";
    form.reset();
    setSelectedFile(null);
    hideError();
    stopProgress();
    resultsSection.classList.add("hidden");
    uploadPanel.classList.remove("hidden");
    window.scrollTo({ top: uploadPanel.offsetTop - 20, behavior: "smooth" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function buildWordHtml(report) {
    const info = report.recruitment_information || {};
    const analysis = report.jd_analysis || {};
    const briefing = report.standardised_briefing || {};
    const sources = arrayOrEmpty(briefing.source_list);
    const list = (items) => `<ul>${arrayOrEmpty(items).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

    return `<!doctype html>
      <html><head><meta charset="utf-8"><title>${escapeHtml(briefing.title)}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#17213b;line-height:1.5;margin:36px}
        h1,h2{color:#101b3f} h1{border-bottom:4px solid #d3a93a;padding-bottom:10px}
        table{width:100%;border-collapse:collapse;margin:12px 0 22px}th,td{border:1px solid #cbd2df;padding:8px;text-align:left;vertical-align:top}
        th{background:#f3f5f9}.note{background:#fff7e5;padding:12px;border-left:4px solid #d3a93a}
        a{color:#1a2c61}
      </style></head><body>
      <h1>${escapeHtml(briefing.title)}</h1>
      <p><strong>Mandatory pre-reading before the JD Dugout</strong></p>
      <p><strong>Estimated reading time:</strong> ${escapeHtml(displayValue(briefing.reading_time))}</p>
      <h2>Recruitment information</h2>
      <table>
        <tr><th>Company</th><td>${escapeHtml(displayValue(info.company_name))}</td></tr>
        <tr><th>Role</th><td>${escapeHtml(displayValue(info.role_title))}</td></tr>
        <tr><th>Location</th><td>${escapeHtml(displayValue(info.location))}</td></tr>
        <tr><th>Compensation</th><td>${escapeHtml(displayValue(info.compensation))}</td></tr>
        <tr><th>Application deadline</th><td>${escapeHtml(displayValue(info.application_deadline))}</td></tr>
        <tr><th>Interview date</th><td>${escapeHtml(displayValue(info.interview_date))}</td></tr>
      </table>
      <h2>Executive summary</h2><p>${escapeHtml(briefing.executive_summary)}</p>
      <h2>1. Company at a glance</h2><p>${escapeHtml(briefing.company_at_a_glance)}</p>
      <h2>2. How the company makes money</h2><p>${escapeHtml(briefing.how_the_company_makes_money)}</p>
      <h2>3. What the company sells</h2>${list(briefing.what_the_company_sells)}
      <h2>4. Who its customers are</h2>${list(briefing.who_its_customers_are)}
      <h2>5. Industry and competitors</h2><p>${escapeHtml(briefing.industry_and_competitors)}</p>
      <h2>6. Recent developments that matter</h2>${list(briefing.recent_developments_that_matter)}
      <h2>7. Why the company may be hiring</h2><p>${escapeHtml(briefing.why_the_company_may_be_hiring)}</p>
      <h2>8. What this role does</h2><p>${escapeHtml(briefing.what_this_role_does)}</p>
      <h2>9. What the recruiter is likely to look for</h2>${list(briefing.recruiter_priorities)}
      <h2>10. Questions students should prepare</h2>${list(briefing.questions_students_should_prepare)}
      <h2>JD requirement-to-evidence map</h2>
      <table><tr><th>Requirement</th><th>Evidence students should show</th></tr>
      ${arrayOrEmpty(analysis.evidence_map).map((row) => `<tr><td>${escapeHtml(row?.requirement)}</td><td>${escapeHtml(row?.evidence_student_should_show)}</td></tr>`).join("")}
      </table>
      <h2>Sources</h2><ol>${sources.map((source) => {
        const url = safeUrl(source?.url);
        return `<li>${escapeHtml(source?.title)}${url ? ` — <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>` : ""}</li>`;
      }).join("")}</ol>
      <p class="note"><strong>L&amp;D validation:</strong> ${escapeHtml(briefing.disclaimer)}</p>
      </body></html>`;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeTab = tab.dataset.tab || "overview";
      renderActiveTab();
    });
  });

  fileInput.addEventListener("change", () => setSelectedFile(fileInput.files?.[0]));

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });
  dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    setSelectedFile(file);
  });

  form.addEventListener("submit", submitBriefing);
  clearButton.addEventListener("click", resetForm);
  newBriefingButton.addEventListener("click", resetForm);
  printButton.addEventListener("click", () => window.print());

  downloadJsonButton.addEventListener("click", () => {
    if (!currentEnvelope) return;
    const report = currentEnvelope.report || {};
    const filename = `${slugify(report?.meta?.company_name)}-${slugify(report?.meta?.role_title)}-briefing.json`;
    downloadBlob(new Blob([JSON.stringify(currentEnvelope, null, 2)], { type: "application/json" }), filename);
  });

  downloadWordButton.addEventListener("click", () => {
    if (!currentEnvelope?.report) return;
    const report = currentEnvelope.report;
    const filename = `${slugify(report?.meta?.company_name)}-${slugify(report?.meta?.role_title)}-briefing.doc`;
    downloadBlob(new Blob(["\ufeff", buildWordHtml(report)], { type: "application/msword" }), filename);
  });
})();
