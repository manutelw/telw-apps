import { onRequest as existingTrainerPage } from './_trainer-page-existing.js';

export async function onRequest(context) {
  const response = await existingTrainerPage(context);
  if (!response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();

  const bridge = `
<script data-ascent-trainer-session-bridge="2026-09-14.1">
(function(){
  const key='ascent_trainer_session';
  try {
    if (!localStorage.getItem(key) && !sessionStorage.getItem(key)) {
      const payload = JSON.parse(window.name || 'null');
      const session = payload && payload.__ascentTrainerSession;
      if (session && typeof session === 'object') {
        localStorage.setItem(key, JSON.stringify(session));
        sessionStorage.setItem(key, JSON.stringify(session));
      }
    }
  } catch (_) {
  } finally {
    try {
      const payload = JSON.parse(window.name || 'null');
      if (payload && payload.__ascentTrainerSession) window.name = '';
    } catch (_) {}
  }
})();
</script>`;

  if (!html.includes('data-ascent-trainer-session-bridge')) {
    html = html.replace('</head>', bridge + '\n</head>');
  }

  html = html.replace(
`    if (
      !session.sessionToken ||
      !session.email ||
      !Number.isFinite(expiryTime) ||
      expiryTime <= Date.now()
    ) {
      throw new Error(
        "Incomplete or expired staff session"
      );
    }

    if (
      role !== "ADMIN" &&
      !session.trainerUuid
    ) {
      throw new Error(
        "Trainer identity is missing"
      );
    }`,
`    if (!session.sessionToken) {
      throw new Error(
        "Staff session token is missing"
      );
    }

    if (Number.isFinite(expiryTime) && expiryTime <= Date.now()) {
      throw new Error(
        "Staff session has expired"
      );
    }`
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
