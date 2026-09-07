export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isEvaluator = url.pathname === '/workplace-communication-test/evaluator.html';
  const isTest = url.pathname === '/workplace-communication-test/' || url.pathname === '/workplace-communication-test/index.html';

  if (isEvaluator && url.searchParams.get('dashboard') !== '1') {
    return Response.redirect(new URL('/workplace-communication-test/access.html', url.origin).toString(), 302);
  }

  const response = await context.next();
  if (!isTest || !response.ok) return response;

  let html = await response.text();
  html = html.replace('Trainer / Admin access', 'Workplace Communication Test access');
  html = html.replace('This Workplace Communication Test is currently restricted to authorised ClarionPrep trainers and administrators.', 'Sign in with the ClarionPrep account that has been granted Workplace Communication Test access.');
  html = html.replace('Email or username', 'Email, username or Student ID');

  const accessScript = `<script>
(function(){
  const API='https://vtqatrhwfvzyodiftvkc.supabase.co/functions/v1/wct-access';
  const form=document.getElementById('accessForm');
  const card=document.getElementById('accessCard');
  const msg=document.getElementById('accessMessage');
  const btn=document.getElementById('accessBtn');
  const showTest=(d,token)=>{
    window.WCT_ACCESS_TOKEN=token;
    sessionStorage.setItem('WCT_SESSION_TOKEN',token);
    card.classList.add('hidden');
    document.getElementById('intro').classList.remove('hidden');
    document.getElementById('identityCard').classList.remove('hidden');
    const p=d.profile||{};
    if(p.full_name)document.getElementById('candidateName').value=p.full_name;
    if(p.email)document.getElementById('candidateEmail').value=p.email;
    if(p.student_id)document.getElementById('candidateId').value=p.student_id;
    else if(p.email)document.getElementById('candidateId').value=p.email;
    if(p.batch)document.getElementById('cohort').value=p.batch;
    else if(d.role)document.getElementById('cohort').value='ClarionPrep '+String(d.role).toUpperCase();
  };
  const call=async(body,token)=>{
    const headers={'Content-Type':'application/json'};
    if(token)headers.Authorization='Bearer '+token;
    const r=await fetch(API,{method:'POST',headers,body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok)throw new Error(d.error||'WCT access is not enabled for this account.');
    return d;
  };
  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const raw=document.getElementById('accessEmail').value.trim();
      const identity=raw.toLowerCase()==='manu'?'manutelw@gmail.com':raw;
      const password=document.getElementById('accessPassword').value;
      msg.className='message';msg.textContent='Checking access…';btn.disabled=true;
      try{const d=await call({action:'login',identity,password},'');showTest(d,d.session_token);msg.textContent=''}
      catch(err){window.WCT_ACCESS_TOKEN='';sessionStorage.removeItem('WCT_SESSION_TOKEN');msg.className='message error';msg.textContent=err.message||'Access denied.'}
      finally{btn.disabled=false}
    },true);
  }
  const saved=sessionStorage.getItem('WCT_SESSION_TOKEN');
  if(saved){call({action:'status'},saved).then(d=>showTest(d,saved)).catch(()=>{sessionStorage.removeItem('WCT_SESSION_TOKEN');window.WCT_ACCESS_TOKEN='';});}
})();
</script>`;
  html = html.replace('</body>', accessScript + '</body>');

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=UTF-8');
  headers.set('cache-control', 'no-store, max-age=0');
  return new Response(html, {status: response.status, statusText: response.statusText, headers});
}
