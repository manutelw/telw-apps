const $ = (id) => document.getElementById(id);
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function setMessage(text, error=false) { $("trainerMessage").textContent=text||""; $("trainerMessage").classList.toggle("error",error); }
async function load() {
  setMessage("Loading private test results…");
  $("applyButton").disabled=true;
  const params=new URLSearchParams();
  const practiceType=$("practiceTypeFilter").value;
  const difficulty=$("difficultyFilter").value;
  const tester=$("testerFilter").value.trim();
  if(practiceType) params.set("practiceType",practiceType);
  if(difficulty) params.set("difficulty",difficulty);
  if(tester) params.set("tester",tester);
  try {
    const response=await fetch(`/api/admin/results?${params}`);
    const payload=await response.json();
    if(!response.ok||payload.ok===false) throw new Error(payload.message||`Request failed (${response.status}).`);
    $("resultsBody").innerHTML=payload.items.length?payload.items.map((item)=>`<tr><td>${escapeHtml(item.testerEmail)}</td><td><strong>${escapeHtml(item.title)}</strong><div class="history-meta">${escapeHtml(item.practiceType)} · ${escapeHtml(item.topic)}</div></td><td>${escapeHtml(item.profileOrLevel)}<div class="history-meta">${escapeHtml(item.difficulty)}</div></td><td><strong>${Number(item.score).toFixed(1)}/10</strong></td><td>${escapeHtml(item.professionalImpression)}</td><td>${escapeHtml(item.practiceInstruction)}</td><td>${new Date(item.completedAt).toLocaleString()}</td></tr>`).join(""):'<tr><td colspan="7">No matching lab results.</td></tr>';
    setMessage(`${payload.items.length} lab result${payload.items.length===1?"":"s"} shown.`);
  } catch(error) { setMessage(error.message,true); }
  finally { $("applyButton").disabled=false; }
}
$("applyButton").addEventListener("click",load);
load();
