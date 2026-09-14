import { onRequest as existingTrainerPage } from './_trainer-page-existing.js';

export async function onRequest(context) {
  const response = await existingTrainerPage(context);
  if (!response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();

  const bridge = `
<script data-ascent-trainer-session-bridge="2026-09-14.4">
(function(){
  const key='ascent_trainer_session';
  try {
    const payload = JSON.parse(window.name || 'null');
    const session = payload && payload.__ascentTrainerSession;
    if (session && typeof session === 'object') {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem(key, JSON.stringify(session));
      window.name = '';
    }
  } catch (_) {}
})();
</script>`;

  if (!html.includes('data-ascent-trainer-session-bridge')) {
    html = html.replace('</head>', bridge + '\n</head>');
  }

  const safeLoader = `    function loadTrainerSession() {
  const rawCandidates = [
    localStorage.getItem(SESSION_STORAGE_KEY),
    sessionStorage.getItem(SESSION_STORAGE_KEY),
    localStorage.getItem(ADMIN_MASTER_SESSION_KEY)
  ].filter(Boolean);

  for (const raw of rawCandidates) {
    try {
      const storedSession = JSON.parse(raw);
      const session = {
        ...storedSession,
        sessionToken:
          storedSession.sessionToken ||
          storedSession.session_token ||
          storedSession.token ||
          storedSession.accessToken ||
          storedSession.access_token ||
          "",
        trainerUuid:
          storedSession.trainerUuid ||
          storedSession.trainer_uuid ||
          storedSession.staffUuid ||
          storedSession.staff_uuid ||
          storedSession.userUuid ||
          storedSession.user_uuid ||
          storedSession.id ||
          "",
        fullName:
          storedSession.fullName ||
          storedSession.full_name ||
          storedSession.name ||
          "Trainer",
        email:
          storedSession.email ||
          storedSession.email_address ||
          storedSession.emailAddress ||
          "",
        expiresAt:
          storedSession.expiresAt ||
          storedSession.expires_at ||
          "",
        role:
          String(
            storedSession.role ||
            storedSession.globalRole ||
            storedSession.global_role ||
            "TRAINER"
          ).toUpperCase(),
        accessPointUuid:
          storedSession.accessPointUuid ||
          storedSession.access_point_uuid ||
          "",
        accessPointName:
          storedSession.accessPointName ||
          storedSession.access_point_name ||
          "",
        accessPointSlug:
          storedSession.accessPointSlug ||
          storedSession.access_point_slug ||
          ""
      };

      if (!session.sessionToken) continue;

      if (session.expiresAt) {
        const expiryTime = new Date(session.expiresAt).getTime();
        if (Number.isFinite(expiryTime) && expiryTime <= Date.now()) continue;
      }

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error(error);
    }
  }

  const notice = document.createElement("div");
  notice.id = "trainerSessionError";
  notice.style.cssText = "position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#102b47;padding:24px;font-family:Arial,sans-serif";
  notice.innerHTML = '<div style="max-width:560px;background:#fff;border-radius:16px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.3)"><h2 style="margin:0 0 12px;color:#143a60">Trainer session did not arrive</h2><p style="margin:0 0 18px;color:#40586e;line-height:1.5">ASCENT reached the Trainer Workspace, but no usable trainer session was available in this browser tab. The page has been kept here instead of sending you back to the Access Point.</p><a href="./" style="display:inline-block;padding:11px 16px;border-radius:10px;background:#143a60;color:#fff;text-decoration:none;font-weight:700">Return to Trainer Login</a></div>';
  document.body.appendChild(notice);
  return null;
}`;

  html = html.replace(
    /    function loadTrainerSession\(\) \{[\s\S]*?\n\}\n\n    function showSection/,
    safeLoader + '\n\n    function showSection'
  );

  const headers = new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  headers.delete('content-length');
  return new Response(html,{
    status:response.status,
    statusText:response.statusText,
    headers
  });
}
