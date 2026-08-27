(function () {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const oldSubmitUrl = SUPABASE_URL + "/functions/v1/ascent-submit-response";
  const legacyV2SubmitUrl = SUPABASE_URL + "/functions/v1/ascent-submit-response-v2";
  const safeSubmitUrl = SUPABASE_URL + "/functions/v1/ascent-submit-safe";
  const safeFallbackSubmitUrl = SUPABASE_URL + "/functions/v1/ascent-submit-safe-fallback";
  const customCreditsUrl = SUPABASE_URL + "/rest/v1/rpc/ascent_get_custom_question_credits";
  const CLIENT_SUBMISSION_KEY_PREFIX = "ascent_protected_submission_v1|";
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  let customCreditsRemaining = 0;
  let customCreditsLoaded = false;

  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function requestUrl(input) {
    if (typeof input === "string") return input;
    if (input && typeof input.url === "string") return input.url;
    return "";
  }

  function hashText(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function submissionStorageKey(formData) {
    const phase = String(formData.get("response_phase") || "main").toLowerCase();
    const student = String(currentSession && currentSession.studentUuid || "student");
    let identity = "";

    if (phase === "pressure") {
      identity = "pressure|" + String(formData.get("submission_id") || "unknown");
    } else if (formData.get("assignment_uuid")) {
      identity = "assigned|" + String(formData.get("assignment_uuid"));
    } else if (formData.get("question_bank_uuid")) {
      identity = "bank|" + String(formData.get("question_bank_uuid"));
    } else if (formData.get("custom_question")) {
      identity = "custom|" + hashText(String(formData.get("custom_question"))) + "|" + String(formData.get("custom_rubric_type") || "");
    } else {
      identity = phase + "|unknown";
    }

    return CLIENT_SUBMISSION_KEY_PREFIX + student + "|" + identity;
  }

  function ensureClientSubmissionId(init) {
    if (!init || !(init.body instanceof FormData)) return "";

    const formData = init.body;
    const existing = String(formData.get("client_submission_id") || "").trim();
    if (UUID_PATTERN.test(existing)) {
      return submissionStorageKey(formData);
    }

    const storageKey = submissionStorageKey(formData);
    let clientSubmissionId = "";

    try {
      clientSubmissionId = String(localStorage.getItem(storageKey) || "").trim();
    } catch (_error) {
      clientSubmissionId = "";
    }

    if (!UUID_PATTERN.test(clientSubmissionId)) {
      clientSubmissionId = crypto.randomUUID();
      try {
        localStorage.setItem(storageKey, clientSubmissionId);
      } catch (error) {
        console.warn("ASCENT could not persist the protected submission reference:", error);
      }
    }

    formData.set("client_submission_id", clientSubmissionId);
    return storageKey;
  }

  async function clearSubmissionReferenceWhenConfirmed(response, storageKey) {
    if (!storageKey || !response) return response;

    try {
      const clone = response.clone();
      const text = await clone.text();
      let payload = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (_error) {
        payload = null;
      }

      if (
        (response.ok && payload && payload.ok === true) ||
        (payload && payload.error === "question_already_answered")
      ) {
        try {
          localStorage.removeItem(storageKey);
        } catch (_error) {}
      }
    } catch (error) {
      console.warn("ASCENT could not inspect the protected submission acknowledgement:", error);
    }

    return response;
  }

  async function trySubmitEndpoint(url, init, label, attempts) {
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await nativeFetch(url, init);

        if ([502, 503, 504].includes(response.status) && attempt < attempts) {
          console.warn("ASCENT " + label + " attempt " + attempt + " returned " + response.status + ". Retrying.");
          await sleep(attempt === 1 ? 900 : 1800);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;
        console.warn("ASCENT " + label + " network attempt " + attempt + " failed:", error);

        if (attempt < attempts) {
          await sleep(attempt === 1 ? 900 : 1800);
        }
      }
    }

    throw lastError || new TypeError("ASCENT could not reach " + label + ".");
  }

  async function resilientSubmitFetch(input, init) {
    const storageKey = ensureClientSubmissionId(init);
    let primaryError = null;

    try {
      const primaryResponse = await trySubmitEndpoint(safeSubmitUrl, init, "protected primary submission service", 2);
      if (![502, 503, 504].includes(primaryResponse.status)) {
        return await clearSubmissionReferenceWhenConfirmed(primaryResponse, storageKey);
      }
      primaryError = new Error("Protected primary submission service returned " + primaryResponse.status + ".");
      console.warn("ASCENT protected primary route returned a transient failure. Trying protected fallback.");
    } catch (error) {
      primaryError = error;
      console.warn("ASCENT protected primary submission route failed. Trying the protected fallback route.", error);
    }

    await sleep(700);

    try {
      const fallbackResponse = await trySubmitEndpoint(safeFallbackSubmitUrl, init, "protected fallback submission service", 2);
      return await clearSubmissionReferenceWhenConfirmed(fallbackResponse, storageKey);
    } catch (fallbackError) {
      console.error("ASCENT protected fallback submission route also failed.", fallbackError);
      throw primaryError || fallbackError || new TypeError("ASCENT could not reach the protected submission service.");
    }
  }

  window.fetch = function (input, init) {
    const url = requestUrl(input);
    if (
      url === oldSubmitUrl ||
      url === legacyV2SubmitUrl ||
      url === safeSubmitUrl ||
      url === safeFallbackSubmitUrl
    ) {
      return resilientSubmitFetch(input, init);
    }
    return nativeFetch(input, init);
  };

  function getContextCode() {
    return String(practiceContext && practiceContext.code || "");
  }

  function isPrivate() {
    return Boolean(practiceContext && practiceContext.is_private_learner === true);
  }

  function hasAssignedQuestions() {
    return Array.isArray(activeAssignments) && activeAssignments.length > 0;
  }

  function isDiagnosticRequired() {
    return getContextCode() === "diagnostic_required";
  }

  function isDiagnosticComplete() {
    return getContextCode() === "diagnostic_complete";
  }

  function isBulkQuestionOnly() {
    return getContextCode() === "bulk_question_only";
  }

  function isBulkQuestionComplete() {
    return getContextCode() === "bulk_question_complete";
  }

  function ensureCustomPackBox() {
    let box = document.getElementById("customQuestionPackBox");
    if (box) return box;

    box = document.createElement("div");
    box.id = "customQuestionPackBox";
    box.className = "practice-context-note";
    box.hidden = true;

    const text = document.createElement("div");
    text.id = "customQuestionPackText";
    box.appendChild(text);

    const link = document.createElement("a");
    link.id = "customQuestionPackLink";
    link.href = "./custom-question-pack.html";
    link.style.display = "inline-block";
    link.style.marginTop = "10px";
    link.style.padding = "10px 14px";
    link.style.borderRadius = "9px";
    link.style.background = "#143a60";
    link.style.color = "#fff";
    link.style.fontWeight = "800";
    link.textContent = "Buy 3 Questions — ₹500";
    box.appendChild(link);

    practiceModeField.parentNode.insertBefore(box, practiceModeField.nextSibling);
    return box;
  }

  function updateCustomPackBox() {
    const box = ensureCustomPackBox();
    const text = document.getElementById("customQuestionPackText");
    const link = document.getElementById("customQuestionPackLink");

    if (!isPrivate() || isDiagnosticRequired() || isDiagnosticComplete()) {
      box.hidden = true;
      return;
    }

    box.hidden = false;

    if (customCreditsRemaining > 0) {
      text.innerHTML = "<strong>My Own Questions:</strong> " + customCreditsRemaining +
        (customCreditsRemaining === 1 ? " question credit left." : " question credits left.");
      link.hidden = true;
    } else {
      text.innerHTML = "<strong>Want to practise your own question?</strong><br>Private learners can buy 3 personalised question evaluations for ₹500.";
      link.hidden = false;
    }
  }

  async function refreshCustomCredits() {
    if (!practiceContext || !currentSession || !currentSession.sessionToken) return;

    if (!isPrivate()) {
      customCreditsRemaining = Number.POSITIVE_INFINITY;
      customCreditsLoaded = true;
      return;
    }

    try {
      const response = await nativeFetch(customCreditsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": "Bearer " + SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({ p_session_token: currentSession.sessionToken })
      });
      const payload = await response.json();
      const result = Array.isArray(payload) ? payload[0] : payload;
      customCreditsRemaining = result && Number.isFinite(Number(result.credits_remaining))
        ? Math.max(0, Number(result.credits_remaining))
        : 0;
      customCreditsLoaded = true;
    } catch (error) {
      console.error("ASCENT custom-credit status failed:", error);
      customCreditsRemaining = 0;
      customCreditsLoaded = true;
    }
  }

  renderPracticeContext = function () {
    clearElement(practiceModeSelect);

    const privateLearner = isPrivate();
    const diagnosticRequired = isDiagnosticRequired();
    const diagnosticComplete = isDiagnosticComplete();
    const bulkOnly = isBulkQuestionOnly();
    const bulkComplete = isBulkQuestionComplete();
    const assignedAvailable = hasAssignedQuestions();

    practiceModeField.hidden = false;
    practiceContextNote.hidden = true;
    practiceContextNote.textContent = "";

    if (diagnosticRequired) {
      if (questionBank.length > 0) {
        const option = document.createElement("option");
        option.value = "question_bank";
        option.textContent = "ASCENT Diagnostic";
        practiceModeSelect.appendChild(option);
      }
    } else if (bulkOnly) {
      if (assignedAvailable) {
        const assignedOption = document.createElement("option");
        assignedOption.value = "assigned";
        assignedOption.textContent = "Released question";
        practiceModeSelect.appendChild(assignedOption);
      }
    } else if (!diagnosticComplete && !bulkComplete) {
      if (assignedAvailable) {
        const assignedOption = document.createElement("option");
        assignedOption.value = "assigned";
        assignedOption.textContent = "My JD Builder / assigned questions";
        practiceModeSelect.appendChild(assignedOption);
      }

      if (questionBank.length > 0) {
        const bankOption = document.createElement("option");
        bankOption.value = "question_bank";
        bankOption.textContent = "Choose from the ASCENT question bank";
        practiceModeSelect.appendChild(bankOption);
      }

      if (!privateLearner || customCreditsRemaining > 0) {
        const customOption = document.createElement("option");
        customOption.value = "custom";
        customOption.textContent = privateLearner
          ? "Enter my own question (" + customCreditsRemaining + " credit" + (customCreditsRemaining === 1 ? "" : "s") + " left)"
          : "Enter my own question";
        practiceModeSelect.appendChild(customOption);
      }
    }

    populateAssignedTasks();
    populateQuestionBanks();

    practiceContextLoading.hidden = true;
    practiceContextControls.hidden = false;
    updateCustomPackBox();

    if (diagnosticComplete) {
      practiceModeField.hidden = true;
      assignedTaskField.hidden = true;
      questionBankField.hidden = true;
      customQuestionField.hidden = true;
      selectedQuestionBox.hidden = true;
      startButton.disabled = true;
      practiceContextNote.innerHTML = "<strong>Diagnostic complete.</strong> You are ready to continue with paid PI or GD practice.<br><a href='./index.html' style='display:inline-block;margin-top:10px;font-weight:800;color:#143a60'>View ASCENT practice options</a>";
      practiceContextNote.hidden = false;
      passStatusBadge.hidden = true;
      return;
    }

    if (practiceModeSelect.options.length === 0) {
      practiceContextNote.textContent = String(practiceContext && practiceContext.message
        ? practiceContext.message
        : "No practice question is available right now.");
      practiceContextNote.hidden = false;
      practiceContextControls.hidden = false;
      practiceModeField.hidden = true;
      assignedTaskField.hidden = true;
      questionBankField.hidden = true;
      customQuestionField.hidden = true;
      selectedQuestionBox.hidden = true;
      startButton.disabled = true;
      updateCustomPackBox();
      return;
    }

    if (assignedAvailable) {
      practiceModeSelect.value = "assigned";
    } else if (questionBank.length > 0) {
      practiceModeSelect.value = "question_bank";
    } else {
      practiceModeSelect.value = "custom";
    }

    updatePassStatus();
    if (diagnosticRequired) passStatusBadge.hidden = true;
    updatePracticeMode();

    if (!diagnosticRequired && !diagnosticComplete) {
      practiceContextNote.textContent = String(practiceContext && practiceContext.message
        ? practiceContext.message
        : "Choose the question you want to practise.");
      practiceContextNote.hidden = false;
    }
  };

  const originalLoadPracticeContext = loadPracticeContext;
  loadPracticeContext = async function () {
    await originalLoadPracticeContext();
    await refreshCustomCredits();
    if (practiceContext) renderPracticeContext();
  };

  newResponseButton.addEventListener("click", function (event) {
    const code = getContextCode();
    if (practiceContext && practiceContext.is_private_learner !== true &&
        (code === "institutional_open_bank" || code === "institutional_open_bank_with_assigned" || code === "bulk_question_only")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.reload();
    }
  }, true);

  void loadPracticeContext();
})();
