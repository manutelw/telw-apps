const $ = (id) => document.getElementById(id);

const state = {
  sessionId: null,
  scenarioId: null,
  lastConfig: null,
  audioBlob: null,
  recorder: null,
  chunks: [],
  timerHandle: null,
  startedAt: 0,
  currentPrompt: "",
  transcript: []
};

const studentTopics = [
  ["SURPRISE", "Surprise Me"],
  ["SELF_POSITIONING", "Self-positioning"],
  ["PROJECTS", "Projects and experience"],
  ["DECISIONS", "Decisions and judgement"],
  ["MISTAKES", "Mistakes and learning"],
  ["DEADLINES", "Deadlines and priorities"],
  ["CLIENT_SERVICE", "Client service"],
  ["ETHICS", "Ethics and confidentiality"]
];

const workplaceTopics = [
  ["SURPRISE", "Surprise Me"],
  ["MANAGING_UP", "Managing Up"],
  ["CLIENT_COMMUNICATION", "Client Communication"],
  ["TEAM_COMMUNICATION", "Team Communication"],
  ["PROFESSIONAL_BOUNDARIES", "Professional Boundaries"],
  ["DECISION_COMMUNICATION", "Decision Communication"],
  ["CRISIS_DELAY_UPDATES", "Crisis and Delay Updates"],
  ["DISAGREEMENT_PUSHBACK", "Disagreement and Pushback"],
  ["LEADERSHIP_COMMUNICATION", "Leadership Communication"]
];

function setMessage(element, message, isError = false) {
  element.textContent = message || "";
  element.classList.toggle("error", isError);
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; }
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || `Request failed (${response.status}).`);
  }
  return payload;
}

function updateForm() {
  const isWorkplace = $("practiceType").value === "WORKPLACE_DIALOGUE";
  $("profileField").hidden = isWorkplace;
  $("levelField").hidden = !isWorkplace;
  const topics = isWorkplace ? workplaceTopics : studentTopics;
  $("topicKey").innerHTML = topics.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function currentConfig() {
  const practiceType = $("practiceType").value;
  return {
    practiceType,
    profileKey: practiceType === "WORKPLACE_DIALOGUE" ? null : $("profileKey").value,
    levelKey: practiceType === "WORKPLACE_DIALOGUE" ? $("levelKey").value : null,
    difficulty: $("difficulty").value,
    topicKey: $("topicKey").value
  };
}

function showOnly(panelId) {
  ["setupPanel", "conversationPanel", "resultPanel", "historyPanel"].forEach((id) => {
    $(id).hidden = id !== panelId;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toAudioUrl(base64, mimeType = "audio/mpeg") {
  return `data:${mimeType};base64,${base64}`;
}

function renderTimeline() {
  $("timeline").innerHTML = state.transcript.map((turn) => {
    const roleClass = turn.speaker === "AI" ? "ai" : "learner";
    const roleName = turn.speaker === "AI" ? "AI" : "Learner";
    return `<div class="bubble ${roleClass}"><div class="role">${roleName}</div><div>${escapeHtml(turn.text)}</div></div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function resetRecorder() {
  state.audioBlob = null;
  state.chunks = [];
  $("answerPreview").hidden = true;
  $("answerPreview").removeAttribute("src");
  $("submitButton").disabled = true;
  $("recordButton").disabled = false;
  $("stopButton").disabled = true;
  $("recordingState").textContent = "Ready to record";
  $("recordingTimer").textContent = "00:00";
  clearInterval(state.timerHandle);
}

function supportedRecorderOptions() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus"
  ];
  const mimeType = candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type));
  return mimeType ? { mimeType } : {};
}

async function startRecording() {
  setMessage($("conversationMessage"), "");
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    setMessage($("conversationMessage"), "This browser cannot record audio. Use a current version of Chrome, Edge or Safari.", true);
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.chunks = [];
    state.recorder = new MediaRecorder(stream, supportedRecorderOptions());
    state.recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) state.chunks.push(event.data);
    });
    state.recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      state.audioBlob = new Blob(state.chunks, { type: state.recorder.mimeType || "audio/webm" });
      $("answerPreview").src = URL.createObjectURL(state.audioBlob);
      $("answerPreview").hidden = false;
      $("submitButton").disabled = !state.audioBlob.size;
      $("recordButton").disabled = false;
      $("stopButton").disabled = true;
      $("recordingState").textContent = "Recording ready to submit";
      clearInterval(state.timerHandle);
    });
    state.recorder.start(250);
    state.startedAt = Date.now();
    $("recordButton").disabled = true;
    $("stopButton").disabled = false;
    $("submitButton").disabled = true;
    $("recordingState").textContent = "Recording…";
    state.timerHandle = setInterval(() => {
      const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
      const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
      const rest = String(seconds % 60).padStart(2, "0");
      $("recordingTimer").textContent = `${minutes}:${rest}`;
      if (seconds >= 90 && state.recorder?.state === "recording") stopRecording();
    }, 250);
  } catch (error) {
    setMessage($("conversationMessage"), error.message || "Microphone access failed.", true);
  }
}

function stopRecording() {
  if (state.recorder?.state === "recording") state.recorder.stop();
}

async function beginConversation({ mode = "NEW_VERSION", scenarioId = null } = {}) {
  const config = state.lastConfig || currentConfig();
  state.lastConfig = config;
  setMessage($("setupMessage"), "Creating a controlled scenario…");
  $("startButton").disabled = true;
  try {
    const payload = await api("/api/session/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, mode, scenarioId })
    });
    state.sessionId = payload.session.id;
    state.scenarioId = payload.session.scenarioId;
    state.currentPrompt = payload.opening.text;
    state.transcript = [{ speaker: "AI", text: payload.opening.text }];
    $("scenarioTitle").textContent = payload.session.title;
    $("scenarioMeta").textContent = payload.session.meta;
    $("turnCounter").textContent = `Answer 1 of ${payload.session.maxLearnerTurns}`;
    $("aiPrompt").textContent = payload.opening.text;
    $("aiAudio").src = toAudioUrl(payload.opening.audioBase64, payload.opening.mimeType);
    renderTimeline();
    resetRecorder();
    showOnly("conversationPanel");
    $("aiAudio").play().catch(() => {});
  } catch (error) {
    setMessage($("setupMessage"), error.message, true);
  } finally {
    $("startButton").disabled = false;
  }
}

async function submitAnswer() {
  if (!state.audioBlob || !state.sessionId) return;
  $("submitButton").disabled = true;
  $("recordButton").disabled = true;
  setMessage($("conversationMessage"), "Understanding your answer and selecting the next move…");
  try {
    const form = new FormData();
    form.append("sessionId", state.sessionId);
    form.append("audio", state.audioBlob, `answer.${state.audioBlob.type.includes("mp4") ? "m4a" : "webm"}`);
    const payload = await api("/api/session/turn", { method: "POST", body: form });
    state.transcript.push({ speaker: "LEARNER", text: payload.transcript });
    if (payload.complete) {
      renderTimeline();
      await evaluateConversation();
      return;
    }
    state.currentPrompt = payload.followUp.text;
    state.transcript.push({ speaker: "AI", text: payload.followUp.text });
    $("aiPrompt").textContent = payload.followUp.text;
    $("aiAudio").src = toAudioUrl(payload.followUp.audioBase64, payload.followUp.mimeType);
    $("turnCounter").textContent = `Answer ${payload.nextLearnerTurn} of ${payload.maxLearnerTurns}`;
    renderTimeline();
    resetRecorder();
    setMessage($("conversationMessage"), "Listen to the follow-up, then record your answer.");
    $("aiAudio").play().catch(() => {});
  } catch (error) {
    setMessage($("conversationMessage"), error.message, true);
    $("recordButton").disabled = false;
    $("submitButton").disabled = false;
  }
}

async function evaluateConversation() {
  setMessage($("conversationMessage"), "Evaluating the complete exchange…");
  try {
    const payload = await api("/api/session/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId })
    });
    renderResult(payload.result);
    showOnly("resultPanel");
  } catch (error) {
    setMessage($("conversationMessage"), error.message, true);
  }
}

function renderResult(result) {
  $("overallScore").textContent = `${Number(result.overallScore).toFixed(1)}/10`;
  $("criterionScores").innerHTML = result.criterionScores.map((item) => (
    `<div class="score-card"><span>${escapeHtml(item.label)}</span><strong>${Number(item.score).toFixed(1)}/10</strong></div>`
  )).join("");
  $("strengths").innerHTML = result.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  $("weaknesses").innerHTML = result.weaknesses.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  $("concernAnswer").textContent = result.concernAnswer;
  $("professionalImpression").textContent = result.professionalImpression;
  $("missedEvidence").textContent = result.missedEvidence;
  $("practiceInstruction").textContent = result.practiceInstruction;
  $("improvedResponse").textContent = result.improvedResponse;
  $("finalTranscript").innerHTML = result.transcript.map((turn) => (
    `<div class="transcript-line"><strong>${turn.speaker === "AI" ? "AI" : "Learner"}:</strong> ${escapeHtml(turn.text)}</div>`
  )).join("");
}

async function loadHistory() {
  showOnly("historyPanel");
  setMessage($("historyMessage"), "Loading test history…");
  $("historyList").innerHTML = "";
  try {
    const payload = await api("/api/session/history");
    if (!payload.items.length) {
      $("historyList").innerHTML = '<div class="wide-card">No completed lab conversations yet.</div>';
    } else {
      $("historyList").innerHTML = payload.items.map((item) => (
        `<article class="history-item"><div><strong>${escapeHtml(item.title)}</strong><div class="history-meta">${escapeHtml(item.meta)} · ${new Date(item.completedAt).toLocaleString()}</div></div><div class="score-ring">${Number(item.score).toFixed(1)}</div></article>`
      )).join("");
    }
    setMessage($("historyMessage"), "");
  } catch (error) {
    setMessage($("historyMessage"), error.message, true);
  }
}

async function checkHealth() {
  try {
    const payload = await api("/api/health");
    $("apiStatus").textContent = payload.label || "Lab ready";
  } catch (error) {
    $("apiStatus").textContent = "Lab unavailable";
    setMessage($("setupMessage"), error.message, true);
    $("startButton").disabled = true;
  }
}

$("practiceType").addEventListener("change", updateForm);
$("startButton").addEventListener("click", () => {
  state.lastConfig = currentConfig();
  beginConversation();
});
$("recordButton").addEventListener("click", startRecording);
$("stopButton").addEventListener("click", stopRecording);
$("submitButton").addEventListener("click", submitAnswer);
$("retryButton").addEventListener("click", () => beginConversation({ mode: "RETRY_SAME", scenarioId: state.scenarioId }));
$("newVersionButton").addEventListener("click", () => beginConversation({ mode: "NEW_VERSION", scenarioId: state.scenarioId }));
$("backButton").addEventListener("click", () => showOnly("setupPanel"));
$("historyButton").addEventListener("click", loadHistory);
$("closeHistoryButton").addEventListener("click", () => showOnly("setupPanel"));

updateForm();
checkHealth();
