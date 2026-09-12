(()=>{
  document.documentElement.style.visibility='hidden';
  const SESSION_KEY='ascent_student_session';
  const ACCESS_API='https://vtqatrhwfvzyodiftvkc.supabase.co/functions/v1/telw-gd-access';
  const PAID_API='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/clarion-public-commerce';
  const LOGIN='/subscribe/?product=GD_LAB';
  const deny=()=>window.location.replace(LOGIN);
  const params=new URLSearchParams(location.search);
  let paidToken=params.get('clarion_token')||localStorage.getItem('clarion_entitlement_GD_LAB')||'';
  let paidDevice=params.get('clarion_device')||localStorage.getItem('clarion_device_v1')||'';
  async function paid(){if(!paidToken||!paidDevice)return false;try{const r=await fetch(PAID_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'CHECK',product_code:'GD_LAB',entitlement_token:paidToken,device_id:paidDevice})});const d=await r.json().catch(()=>({}));if(r.ok&&d.ok===true){localStorage.setItem('clarion_entitlement_GD_LAB',paidToken);localStorage.setItem('clarion_device_v1',paidDevice);history.replaceState(null,'',location.pathname);document.documentElement.style.visibility='visible';return true}}catch{}return false}
  paid().then(ok=>{if(ok)return;let session=null;try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{}if(!session?.sessionToken){deny();return;}fetch(ACCESS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_token:session.sessionToken})}).then(async r=>({ok:r.ok,data:await r.json().catch(()=>({}))})).then(({ok,data})=>{if(!ok||data.ok!==true){if(data?.error==='INVALID_SESSION')localStorage.removeItem(SESSION_KEY);deny();return;}document.documentElement.style.visibility='visible';}).catch(()=>deny());});
})();
