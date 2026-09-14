export async function renderNativeAccessPoint(context) {
  const response = await context.next();
  if (!response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();

  html = html.replace(
`      const loginResult =
        await response.json();

      if (
        !Array.isArray(loginResult) ||
        loginResult.length === 0
      ) {`,
`      let loginResult =
        await response.json();

      if (!Array.isArray(loginResult)) {
        loginResult = loginResult ? [loginResult] : [];
      }

      if (loginResult.length === 0) {`
  );

  html = html.replace(
`      const account =
        loginResult[0];`,
`      const rawLogin =
        loginResult[0] || {};
      const rawAccount =
        (rawLogin.data && typeof rawLogin.data === "object" ? rawLogin.data : null) ||
        (rawLogin.result && typeof rawLogin.result === "object" ? rawLogin.result : null) ||
        (rawLogin.account && typeof rawLogin.account === "object" ? rawLogin.account : null) ||
        rawLogin;

      const account = {
        ...rawAccount,
        session_token:
          rawAccount.session_token ||
          rawAccount.sessionToken ||
          rawAccount.token ||
          rawAccount.access_token ||
          rawAccount.accessToken ||
          "",
        trainer_uuid:
          rawAccount.trainer_uuid ||
          rawAccount.trainerUuid ||
          rawAccount.staff_uuid ||
          rawAccount.staffUuid ||
          rawAccount.user_uuid ||
          rawAccount.userUuid ||
          rawAccount.profile_uuid ||
          rawAccount.profileUuid ||
          rawAccount.id ||
          "",
        full_name:
          rawAccount.full_name ||
          rawAccount.fullName ||
          rawAccount.name ||
          "Trainer",
        email:
          rawAccount.email ||
          rawAccount.email_address ||
          rawAccount.emailAddress ||
          "",
        global_role:
          rawAccount.global_role ||
          rawAccount.globalRole ||
          rawAccount.role ||
          "TRAINER",
        access_role:
          rawAccount.access_role ||
          rawAccount.accessRole ||
          "TRAINER",
        access_point_uuid:
          rawAccount.access_point_uuid ||
          rawAccount.accessPointUuid ||
          selectedAccessPoint?.access_point_uuid ||
          selectedAccessPoint?.accessPointUuid ||
          "",
        access_point_name:
          rawAccount.access_point_name ||
          rawAccount.accessPointName ||
          selectedAccessPoint?.display_name ||
          selectedAccessPoint?.displayName ||
          "",
        access_point_slug:
          rawAccount.access_point_slug ||
          rawAccount.accessPointSlug ||
          selectedAccessPoint?.access_point_slug ||
          selectedAccessPoint?.accessPointSlug ||
          "",
        expires_at:
          rawAccount.expires_at ||
          rawAccount.expiresAt ||
          new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      };`
  );

  html = html.replace(
`        localStorage.setItem(
          "ascent_trainer_session",
          JSON.stringify(trainerSession)
        );`,
`        localStorage.setItem(
          "ascent_trainer_session",
          JSON.stringify(trainerSession)
        );
        sessionStorage.setItem(
          "ascent_trainer_session",
          JSON.stringify(trainerSession)
        );
        try {
          window.name = JSON.stringify({
            __ascentTrainerSession: trainerSession
          });
        } catch (_) {}`
  );

  html = html.replace(
`          destination =
            "./trainer.html";`,
`          destination =
            "./trainer.html#ascent-trainer-session=" +
            encodeURIComponent(JSON.stringify(trainerSession));`
  );

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=UTF-8');
  headers.set('cache-control', 'no-store, max-age=0');
  headers.delete('content-length');
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
