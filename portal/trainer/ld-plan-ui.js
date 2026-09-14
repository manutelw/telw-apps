(()=>{
  const actions=document.querySelector('.top-actions');
  const dashboard=document.getElementById('dashboard');
  if(!actions||!dashboard)return;

  const style=document.createElement('style');
  style.textContent=`
  .ld-plan-btn{background:#e5b94f!important;color:#17130f!important;border-color:#e5b94f!important}
  .ld-overlay{position:fixed;inset:0;background:rgba(23,19,15,.72);z-index:120;display:none;align-items:flex-start;justify-content:center;padding:28px 16px;overflow:auto}.ld-overlay.open{display:flex}
  .ld-shell{width:min(1180px,100%);background:#f7f2e9;border-radius:22px;box-shadow:0 28px 80px rgba(0,0,0,.28);overflow:hidden}
  .ld-head{position:sticky;top:0;z-index:2;background:#17130f;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;gap:18px;align-items:center}.ld-head h2{margin:0;font-size:1.25rem}.ld-head p{margin:4px 0 0;color:rgba(255,255,255,.68);font-size:.8rem}.ld-close{border:0;border-radius:10px;background:rgba(255,255,255,.12);color:#fff;width:40px;height:40px;font-size:1.3rem}
  .ld-body{padding:22px}.ld-hero,.ld-block,.ld-session{background:#fffdf9;border:1px solid #e5dacb;border-radius:16px;padding:20px;margin-bottom:14px}.ld-hero h3{font-size:1.55rem;margin:0 0 8px}.ld-hero p{line-height:1.6;margin:7px 0;color:#51483f}.ld-note{padding:13px 15px;border-left:4px solid #e5b94f;background:#fff7df;border-radius:10px;line-height:1.5;margin-top:14px}.ld-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ld-competency{border:1px solid #e5dacb;border-radius:12px;padding:13px;background:#fff}.ld-competency strong{display:block;margin-bottom:5px}.ld-competency span{font-size:.84rem;color:#70675e;line-height:1.45}.ld-session-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ld-session h3{margin:0}.ld-chip{white-space:nowrap;border-radius:999px;padding:6px 9px;background:#e5eefb;color:#315f9b;font-weight:800;font-size:.72rem}.ld-session h4,.ld-block h3{margin:16px 0 8px}.ld-session ul,.ld-block ul{margin:7px 0 0;padding-left:20px;line-height:1.55}.ld-flow{width:100%;border-collapse:collapse;margin-top:8px}.ld-flow th,.ld-flow td{text-align:left;padding:10px 9px;border-bottom:1px solid #eee6dc;vertical-align:top;font-size:.84rem;line-height:1.45}.ld-flow th{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#70675e}.ld-score-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ld-score{border:1px solid #e5dacb;border-radius:11px;padding:12px}.ld-score strong{display:block}.ld-score span{font-size:.82rem;color:#70675e;line-height:1.45}.ld-error{padding:20px;color:#963e38;font-weight:750}.ld-loading{padding:30px;text-align:center;color:#70675e;font-weight:750}
  @media(max-width:760px){.ld-grid,.ld-score-grid{grid-template-columns:1fr}.ld-session-head{display:block}.ld-chip{display:inline-flex;margin-top:8px}.ld-body{padding:13px}.ld-flow{display:block;overflow-x:auto}}
  `;
  document.head.appendChild(style);

  const button=document.createElement('button');
  button.type='button';button.id='ldPlanBtn';button.className='btn btn-ghost ld-plan-btn hidden';button.innerHTML='<span>L&D Training Plan</span> ↗';
  const refresh=document.getElementById('refreshBtn');actions.insertBefore(button,refresh||actions.firstChild);

  const overlay=document.createElement('div');overlay.className='ld-overlay';overlay.id='ldPlanOverlay';overlay.innerHTML=`<section class="ld-shell"><header class="ld-head"><div><h2>Trainer Resource · Learning & Development</h2><p>Authorised trainer/admin viewing only</p></div><button class="ld-close" type="button" aria-label="Close">×</button></header><main class="ld-body" id="ldPlanBody"><div class="ld-loading">Loading trainer plan…</div></main></section>`;
  document.body.appendChild(overlay);
  const body=overlay.querySelector('#ldPlanBody');
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function syncVisibility(){button.classList.toggle('hidden',dashboard.classList.contains('hidden'));}
  new MutationObserver(syncVisibility).observe(dashboard,{attributes:true,attributeFilter:['class']});syncVisibility();

  function render(plan){
    const competencies=(plan.competencyMap||[]).map(x=>`<div class="ld-competency"><strong>${esc(x.name)}</strong><span>${esc(x.evidence)}</span></div>`).join('');
    const sessions=(plan.sessions||[]).map(s=>`<article class="ld-session"><div class="ld-session-head"><div><div class="eyebrow">Session ${esc(s.n)}</div><h3>${esc(s.title)}</h3></div><span class="ld-chip">${esc(s.time)}</span></div><h4>Learning outcomes</h4><ul>${(s.objectives||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4>Trainer flow</h4><table class="ld-flow"><thead><tr><th>Time</th><th>Block</th><th>What the trainer does</th></tr></thead><tbody>${(s.flow||[]).map(r=>`<tr><td>${esc(r[0])}</td><td><strong>${esc(r[1])}</strong></td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table><div class="ld-note"><strong>Student evidence:</strong> ${esc(s.deliverable)}</div><h4>Trainer watch-outs</h4><ul>${(s.trainerWatch||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article>`).join('');
    const score=(plan.scoring?.areas||[]).map(x=>`<div class="ld-score"><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('');
    const remediation=(plan.remediation||[]).map(x=>`<li><strong>${esc(x[0])}:</strong> ${esc(x[1])}</li>`).join('');
    const questions=(plan.placementQuestions||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    body.innerHTML=`<section class="ld-hero"><div class="eyebrow">Placement readiness · trainer guide</div><h3>${esc(plan.title)}</h3><p><strong>Audience:</strong> ${esc(plan.audience)}</p><p><strong>Format:</strong> ${esc(plan.format)}</p><p><strong>End outcome:</strong> ${esc(plan.outcome)}</p><div class="ld-note"><strong>Trainer rule:</strong> ${esc(plan.trainerRule)}</div></section><section class="ld-block"><h3>What this plan is building</h3><div class="ld-grid">${competencies}</div></section>${sessions}<section class="ld-block"><h3>Final trainer rubric</h3><p>${esc(plan.scoring?.scale||'')}</p><div class="ld-score-grid">${score}</div></section><section class="ld-block"><h3>How to prescribe remediation from Career Track Fit</h3><ul>${remediation}</ul></section><section class="ld-block"><h3>L&D placement questions to practise</h3><ol>${questions}</ol></section><section class="ld-block"><h3>Trainer close</h3><p>${esc(plan.trainerClose)}</p></section>`;
  }

  async function openPlan(){
    overlay.classList.add('open');body.innerHTML='<div class="ld-loading">Loading trainer plan…</div>';
    try{
      const sessionResult=await db.auth.getSession();
      const token=sessionResult?.data?.session?.access_token;
      if(!token)throw new Error('Trainer session unavailable. Sign in again.');
      const res=await fetch('/portal/trainer/ld-plan',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'Unable to load trainer plan.');
      render(data.plan||{});
    }catch(err){body.innerHTML=`<div class="ld-error">${esc(err?.message||'Unable to load trainer plan.')}</div>`;}
  }
  button.addEventListener('click',openPlan);
  overlay.querySelector('.ld-close').addEventListener('click',()=>overlay.classList.remove('open'));
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.classList.remove('open')});
})();
