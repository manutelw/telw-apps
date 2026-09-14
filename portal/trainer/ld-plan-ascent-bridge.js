(()=>{
  const KEY='ascent_trainer_session';
  function token(){try{return JSON.parse(localStorage.getItem(KEY)||'null')?.sessionToken||''}catch(_){return''}}
  function wire(){
    const button=document.getElementById('ldPlanBtn');
    if(!button)return setTimeout(wire,100);
    button.addEventListener('click',e=>{
      const t=token();if(!t)return;
      e.preventDefault();e.stopImmediatePropagation();
      const form=document.createElement('form');form.method='POST';form.action='/ascent/ld-training-plan';form.target='_blank';form.style.display='none';
      const input=document.createElement('input');input.type='hidden';input.name='ascent_session_token';input.value=t;form.appendChild(input);document.body.appendChild(form);form.submit();setTimeout(()=>form.remove(),1000);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
