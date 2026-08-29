window.JD_BRIEFING_CONFIG = {
  functionUrl: "https://vtqatrhwfvzyodiftvkc.supabase.co/functions/v1/jd-briefing",
  maxFileMb: 15,
};

window.addEventListener("DOMContentLoaded", () => {
  const script = document.createElement("script");
  script.src = "workflow-stage-nav.js";
  document.body.appendChild(script);
});
