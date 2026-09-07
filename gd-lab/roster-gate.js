(function(){
'use strict';
const SESSION_KEY='ascent_student_session',API='https://vtqatrhwfvzyodiftvkc.supabase.co/functions/v1/gd-dugout-assigned-access';
let s=null;try{s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{}
const id=String(s?.studentId||s?.student_id||'');if(['ADMIN-DEMO-INSTITUTIONAL','ADMIN-DEMO-PRIVATE'].includes(id))return;
const topic=(new URLSearchParams(location.search).get('topic')||'').trim();
function block(msg){const open=document.getElementById('openBtn'),group=document.getElementById('groupBtn'),st=document.getElementById('introStatus');if(open)open.disabled=true;if(group)group.disabled=true;if(st){st.textContent=msg;st.classList.remove('hidden')}}
if(!s?.sessionToken){block('Sign in to ASCENT to open this GD DUGOUT assignment.');return}
block('Checking your released GD assignment…');
fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_token:s.sessionToken})}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok||d.ok!==true)throw Error('Your GD assignment could not be verified.');const allowed=(d.assignments||[]).some(a=>(a.topics||[]).some(t=>String(t||'').trim()===topic));if(!allowed)throw Error('This GD DUGOUT topic has not been released to your ASCENT account.');const open=document.getElementById('openBtn'),group=document.getElementById('groupBtn'),st=document.getElementById('introStatus');if(open)open.disabled=false;if(group)group.disabled=false;if(st)st.classList.add('hidden')}).catch(e=>block(e.message||'This GD DUGOUT topic is not available to your account.'));
})();