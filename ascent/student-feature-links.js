(function(){
  'use strict';
  const KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
  const URL='https://vtqatrhwfvzyodiftvkc.supabase.co/rest/v1/rpc/ascent_student_feature_access_status';
  const SESSION_KEY='ascent_student_session';
  const gd=document.getElementById('gdLabLink');
  const pi=document.getElementById('piLabLink');
  if(!gd&&!pi)return;
  let s=null;
  try{s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{}
  if(!s?.sessionToken)return;
  fetch(URL,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+KEY},body:JSON.stringify({p_session_token:s.sessionToken})})
    .then(r=>r.json().then(d=>({ok:r.ok,d})))
    .then(({ok,d})=>{
      if(!ok||d?.ok!==true)return;
      if(gd)gd.hidden=d?.features?.gdLab!==true;
      if(pi)pi.hidden=d?.features?.piLab!==true;
    })
    .catch(()=>{});
})();
