export async function onRequest(context){
  const response=await context.next();
  if(!response.ok)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  html=html.replace('          const loginResult =\n            await response.json();','          let loginResult =\n            await response.json();\n\n          if (!Array.isArray(loginResult)) {\n            loginResult = loginResult ? [loginResult] : [];\n          }');
  html=html.replace('          const trainer =\n            loginResult[0];',`          const rawTrainer = loginResult[0] || {};
          const trainer = {
            ...rawTrainer,
            session_token: rawTrainer.session_token || rawTrainer.sessionToken || rawTrainer.token || '',
            trainer_uuid: rawTrainer.trainer_uuid || rawTrainer.trainerUuid || rawTrainer.staff_uuid || rawTrainer.staffUuid || rawTrainer.user_uuid || rawTrainer.userUuid || rawTrainer.profile_uuid || rawTrainer.profileUuid || rawTrainer.id || '',
            full_name: rawTrainer.full_name || rawTrainer.fullName || rawTrainer.name || email,
            email: rawTrainer.email || email,
            role: rawTrainer.role || (ADMIN_ENTRY_REQUESTED ? 'ADMIN' : 'TRAINER'),
            expires_at: rawTrainer.expires_at || rawTrainer.expiresAt || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
          };`);
  html=html.replace(`          localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(sessionData)
          );`,`          localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(sessionData)
          );

          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(sessionData)
          );`);
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
