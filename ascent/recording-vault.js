(function () {
  "use strict";

  const DB_NAME = "ascent_recording_vault_v1";
  const DB_VERSION = 1;
  const STORE_NAME = "recordings";
  const SESSION_KEY = "ascent_student_session";
  const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const POLL_MS = 450;

  let lastSeenBlob = null;
  let restoreAttempted = false;
  let activeVaultKey = "";

  function readSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return value && value.studentUuid ? value : null;
    } catch (_error) {
      return null;
    }
  }

  function openVault() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB unavailable"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("studentUuid", "studentUuid", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Recording vault unavailable")); };
    });
  }

  async function withStore(mode, callback) {
    const db = await openVault();
    try {
      return await new Promise(function (resolve, reject) {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        let result;
        try {
          result = callback(store);
        } catch (error) {
          reject(error);
          return;
        }
        transaction.oncomplete = function () { resolve(result); };
        transaction.onerror = function () { reject(transaction.error || new Error("Recording vault transaction failed")); };
        transaction.onabort = function () { reject(transaction.error || new Error("Recording vault transaction aborted")); };
      });
    } finally {
      db.close();
    }
  }

  function requestResult(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Recording vault request failed")); };
    });
  }

  async function getAllForStudent(studentUuid) {
    const db = await openVault();
    try {
      return await new Promise(function (resolve, reject) {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const index = transaction.objectStore(STORE_NAME).index("studentUuid");
        const request = index.getAll(studentUuid);
        request.onsuccess = function () { resolve(Array.isArray(request.result) ? request.result : []); };
        request.onerror = function () { reject(request.error || new Error("Recording vault lookup failed")); };
      });
    } finally {
      db.close();
    }
  }

  async function putRecord(record) {
    const db = await openVault();
    try {
      await new Promise(function (resolve, reject) {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(record);
        transaction.oncomplete = resolve;
        transaction.onerror = function () { reject(transaction.error || new Error("Recording vault save failed")); };
        transaction.onabort = function () { reject(transaction.error || new Error("Recording vault save aborted")); };
      });
    } finally {
      db.close();
    }
  }

  async function deleteRecord(id) {
    if (!id) return;
    const db = await openVault();
    try {
      await new Promise(function (resolve, reject) {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(id);
        transaction.oncomplete = resolve;
        transaction.onerror = function () { reject(transaction.error || new Error("Recording vault delete failed")); };
      });
    } finally {
      db.close();
    }
  }

  async function purgeOldRecords() {
    const session = readSession();
    if (!session) return;
    const records = await getAllForStudent(session.studentUuid);
    const cutoff = Date.now() - MAX_AGE_MS;
    await Promise.all(records.filter(function (record) {
      return Number(record.createdAt || 0) < cutoff;
    }).map(function (record) {
      return deleteRecord(record.id);
    }));
  }

  function currentPhase() {
    try {
      return String(responsePhase || "main");
    } catch (_error) {
      return "main";
    }
  }

  function safeSelectedPractice() {
    if (currentPhase() !== "main") return null;
    try {
      if (typeof getSelectedPractice !== "function") return null;
      const selected = getSelectedPractice();
      if (!selected || selected.valid !== true) return null;
      return {
        valid: true,
        mode: String(selected.mode || ""),
        assignmentUuid: String(selected.assignmentUuid || ""),
        questionBankUuid: String(selected.questionBankUuid || ""),
        question: String(selected.question || ""),
        rubricType: String(selected.rubricType || "")
      };
    } catch (_error) {
      return null;
    }
  }

  function safePressureData() {
    try {
      if (!pressureData || typeof pressureData !== "object") return null;
      return JSON.parse(JSON.stringify(pressureData));
    } catch (_error) {
      return null;
    }
  }

  function vaultKey(studentUuid, phase) {
    let practicePart = "unknown";
    if (phase === "pressure") {
      try {
        practicePart = String(pressureSubmissionId || "pressure");
      } catch (_error) {
        practicePart = "pressure";
      }
    } else {
      const selected = safeSelectedPractice();
      if (selected) {
        practicePart = selected.assignmentUuid || selected.questionBankUuid || selected.question || selected.mode || "main";
      }
    }
    return studentUuid + "|" + phase + "|" + practicePart;
  }

  function ensureNotice() {
    let notice = document.getElementById("ascentRecordingVaultNotice");
    if (notice) return notice;
    const recorderBox = document.querySelector(".recorder-box");
    if (!recorderBox) return null;
    notice = document.createElement("div");
    notice.id = "ascentRecordingVaultNotice";
    notice.hidden = true;
    notice.style.marginTop = "14px";
    notice.style.padding = "11px 13px";
    notice.style.border = "1px solid #b8d8c7";
    notice.style.borderRadius = "10px";
    notice.style.background = "#eef9f3";
    notice.style.color = "#16603f";
    notice.style.fontSize = "13px";
    notice.style.lineHeight = "1.45";
    recorderBox.appendChild(notice);
    return notice;
  }

  function setNotice(message, isError) {
    const notice = ensureNotice();
    if (!notice) return;
    notice.hidden = !message;
    notice.textContent = message || "";
    notice.style.borderColor = isError ? "#efc2bd" : "#b8d8c7";
    notice.style.background = isError ? "#fff3f1" : "#eef9f3";
    notice.style.color = isError ? "#8e2d24" : "#16603f";
  }

  async function persistCurrentBlob(blob) {
    const session = readSession();
    if (!session || !(blob instanceof Blob) || blob.size === 0) return;

    const phase = currentPhase();
    const selectedPractice = safeSelectedPractice();
    let pressureId = "";
    try { pressureId = String(pressureSubmissionId || ""); } catch (_error) {}

    const id = vaultKey(session.studentUuid, phase);
    activeVaultKey = id;

    await putRecord({
      id: id,
      studentUuid: String(session.studentUuid),
      studentId: String(session.studentId || ""),
      createdAt: Date.now(),
      phase: phase,
      pressureSubmissionId: pressureId,
      pressureData: safePressureData(),
      selectedPractice: selectedPractice,
      mimeType: String(blob.type || "audio/wav"),
      size: Number(blob.size || 0),
      blob: blob
    });

    setNotice("Recording protected on this device until ASCENT confirms that it has been saved.", false);
  }

  function serverAlreadyHasRecord(record) {
    try {
      if (!record || record.phase !== "main" || !record.selectedPractice) return false;
      const selected = record.selectedPractice;
      if (selected.assignmentUuid && answeredAssignmentUuids instanceof Set && answeredAssignmentUuids.has(selected.assignmentUuid)) {
        return true;
      }
      if (selected.questionBankUuid && answeredQuestionBankUuids instanceof Set && answeredQuestionBankUuids.has(selected.questionBankUuid)) {
        return true;
      }
    } catch (_error) {}
    return false;
  }

  function setSelectValue(select, value) {
    if (!select || !value) return false;
    const exists = Array.from(select.options || []).some(function (option) { return option.value === value; });
    if (!exists) return false;
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  async function restorePracticeSelection(record) {
    if (!record || record.phase !== "main") return true;
    const selected = record.selectedPractice;
    if (!selected || !selected.mode) return false;

    if (!setSelectValue(practiceModeSelect, selected.mode)) return false;
    await new Promise(function (resolve) { setTimeout(resolve, 80); });

    if (selected.mode === "assigned") {
      return setSelectValue(assignedTaskSelect, selected.assignmentUuid);
    }
    if (selected.mode === "question_bank") {
      return setSelectValue(questionBankSelect, selected.questionBankUuid);
    }
    if (selected.mode === "custom") {
      if (customQuestionInput) customQuestionInput.value = selected.question || "";
      if (customRubricSelect && selected.rubricType) setSelectValue(customRubricSelect, selected.rubricType);
      try { updateSelectedQuestion(); } catch (_error) {}
      return Boolean(selected.question);
    }
    return false;
  }

  function installRecoveredBlob(record) {
    try {
      audioBlob = record.blob;
      lastSeenBlob = audioBlob;
      activeVaultKey = record.id;

      if (audioObjectUrl) {
        try { URL.revokeObjectURL(audioObjectUrl); } catch (_error) {}
      }
      audioObjectUrl = URL.createObjectURL(audioBlob);
      audioPlayback.src = audioObjectUrl;
      audioPlayback.style.display = "";
      playbackSection.classList.add("visible");
      recordingDot.classList.remove("active");
      recordingState.classList.remove("active");
      recordingState.textContent = "Recovered recording ready";
      stopButton.disabled = true;
      startButton.disabled = true;
      submitButton.disabled = false;
      submitButton.textContent = record.phase === "pressure" ? "Retry Pressure Submission" : "Submit Response";

      if (record.phase === "pressure") {
        responsePhase = "pressure";
        pressureSubmissionId = String(record.pressureSubmissionId || "");
        if (record.pressureData) pressureData = record.pressureData;
        recordAgainButton.disabled = true;
      } else {
        responsePhase = "main";
        try { setPracticeContextLocked(true); } catch (_error) {}
        try { applyRecordAgainPolicy(); } catch (_error) { recordAgainButton.disabled = true; }
      }

      setNotice("Your unsent recording was recovered. Listen to it and submit; ASCENT will keep it protected until the server confirms the save.", false);
      try {
        showStatus("Your recording was recovered after the interruption. You do not need to record it again.", "success");
      } catch (_error) {}
      return true;
    } catch (error) {
      console.error("ASCENT recording recovery installation failed:", error);
      return false;
    }
  }

  async function tryRestore() {
    if (restoreAttempted) return;
    const session = readSession();
    if (!session) return;

    let contextReady = false;
    try { contextReady = Boolean(practiceContext); } catch (_error) {}
    if (!contextReady) return;

    restoreAttempted = true;
    let records = await getAllForStudent(session.studentUuid);
    records = records.filter(function (record) {
      return record && record.blob instanceof Blob && record.blob.size > 0 && Number(record.createdAt || 0) >= Date.now() - MAX_AGE_MS;
    }).sort(function (a, b) { return Number(b.createdAt || 0) - Number(a.createdAt || 0); });

    if (!records.length) return;
    const record = records[0];

    if (serverAlreadyHasRecord(record)) {
      await deleteRecord(record.id);
      setNotice("ASCENT confirmed that your earlier response is already saved.", false);
      return;
    }

    const selectionRestored = await restorePracticeSelection(record);
    if (record.phase === "main" && !selectionRestored) {
      restoreAttempted = false;
      return;
    }

    installRecoveredBlob(record);
  }

  function submitUrl(value) {
    const url = typeof value === "string" ? value : (value && typeof value.url === "string" ? value.url : "");
    return /\/functions\/v1\/ascent-submit-response(?:-v2)?(?:$|\?)/.test(url);
  }

  function installFetchAcknowledgementGuard() {
    const protectedFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      const isSubmit = submitUrl(input);
      const response = await protectedFetch(input, init);

      if (isSubmit) {
        try {
          const clone = response.clone();
          const text = await clone.text();
          let payload = null;
          try { payload = text ? JSON.parse(text) : null; } catch (_error) {}

          if (response.ok && payload && payload.ok === true) {
            const keyToClear = activeVaultKey;
            if (keyToClear) {
              await deleteRecord(keyToClear);
              activeVaultKey = "";
            }
            setNotice("ASCENT confirmed that this recording has been safely saved.", false);
          } else if (payload && payload.error === "question_already_answered") {
            const keyToClear = activeVaultKey;
            if (keyToClear) {
              await deleteRecord(keyToClear);
              activeVaultKey = "";
            }
            setNotice("ASCENT already has this response saved. The local safety copy has been cleared.", false);
          } else {
            setNotice("Submission was not confirmed. Your recording remains protected on this device; tap Submit again when ready.", true);
          }
        } catch (error) {
          console.error("ASCENT recording acknowledgement check failed:", error);
          setNotice("ASCENT could not confirm the save yet. Your recording remains protected on this device.", true);
        }
      }

      return response;
    };
  }

  function installRecordAgainGuard() {
    if (!recordAgainButton) return;
    recordAgainButton.addEventListener("click", function () {
      const keyToClear = activeVaultKey;
      if (!keyToClear) return;
      window.setTimeout(function () {
        let stillHasBlob = false;
        try { stillHasBlob = Boolean(audioBlob); } catch (_error) {}
        if (!stillHasBlob) {
          deleteRecord(keyToClear).catch(function (error) {
            console.error("ASCENT recording vault clear failed:", error);
          });
          activeVaultKey = "";
          setNotice("", false);
        }
      }, 120);
    });
  }

  function startBlobMonitor() {
    window.setInterval(function () {
      try {
        if (audioBlob instanceof Blob && audioBlob.size > 0 && audioBlob !== lastSeenBlob) {
          lastSeenBlob = audioBlob;
          persistCurrentBlob(audioBlob).catch(function (error) {
            console.error("ASCENT recording vault save failed:", error);
            setNotice("ASCENT could not create the local safety copy. Keep this page open and submit the recording now.", true);
          });
        }
      } catch (_error) {}

      if (!restoreAttempted) {
        tryRestore().catch(function (error) {
          console.error("ASCENT recording recovery failed:", error);
        });
      }
    }, POLL_MS);
  }

  purgeOldRecords().catch(function (error) {
    console.error("ASCENT recording vault cleanup failed:", error);
  });
  ensureNotice();
  installFetchAcknowledgementGuard();
  installRecordAgainGuard();
  startBlobMonitor();
})();
