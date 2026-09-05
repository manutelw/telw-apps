(()=>{
  document.documentElement.style.visibility='hidden';
  const SESSION_KEY='ascent_student_session';
  const ACCESS_API='https://vtqatrhwfvzyodiftvkc.supabase.co/functions/v1/telw-gd-access';
  const LOGIN='/ascent/';
  const deny=()=>window.location.replace(LOGIN);
  let session=null;
  try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{}
  if(!session?.sessionToken){deny();return;}
  fetch(ACCESS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_token:session.sessionToken})})
    .then(async r=>({ok:r.ok,data:await r.json().catch(()=>({}))}))
    .then(({ok,data})=>{if(!ok||data.ok!==true){if(data?.error==='INVALID_SESSION')localStorage.removeItem(SESSION_KEY);deny();return;}document.documentElement.style.visibility='visible';})
    .catch(()=>deny());
})();
