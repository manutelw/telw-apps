export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const isLanding = url.pathname === '/' || url.pathname === '/index.html';
  const isTrainerPortal = url.pathname === '/portal/trainer/' || url.pathname === '/portal/trainer/index.html';
  const isAdminSettings = url.pathname === '/ascent/admin-settings.html';
  const isAscentTrainer = url.pathname === '/ascent/trainer.html' || url.pathname === '/ascent/trainer' || url.pathname === '/ascent/trainer/';
  const isAccessPoint = url.pathname === '/ascent/' || url.pathname === '/ascent/index.html';

  if (!response.ok || (!isLanding && !isTrainerPortal && !isAdminSettings && !isAscentTrainer && !isAccessPoint)) return response;

  const host = url.hostname.toLowerCase();
  const supportedHost = host === 'clarionprep.com' || host === 'www.clarionprep.com' || host === 'manuvikraman.com' || host === 'www.manuvikraman.com';
  if (!supportedHost) return response;

  let html = await response.text();
  const finish = () => {
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=UTF-8');
    headers.set('cache-control', 'no-store, max-age=0');
    headers.delete('content-length');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  };

  if (isAccessPoint) {
    if (!html.includes('data-access-hidden-fix="1"')) {
      html = html.replace('</head>', '<style data-access-hidden-fix="1">[hidden]{display:none!important}</style>\n</head>');
    }
    return finish();
  }

  if (isAdminSettings) {
    if (!html.includes('id="wctAdminHubCard"')) {
      const wctCard = `<a id="wctAdminHubCard" class="app-card cv" href="/workplace-communication-test/access.html"><strong>Workplace Communication Test</strong><span>Open the WCT, evaluator dashboard and access controls for trainers and students</span></a>`;
      html = html.replace('<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>', wctCard + '\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
    }
    return finish();
  }

  if (isAscentTrainer) {
    const safeLoader = `    function loadTrainerSession() {
  const rawCandidates = [
    localStorage.getItem(SESSION_STORAGE_KEY),
    sessionStorage.getItem(SESSION_STORAGE_KEY),
    localStorage.getItem(ADMIN_MASTER_SESSION_KEY)
  ];

  try {
    const bridgePayload = JSON.parse(window.name || "null");
    if (bridgePayload && bridgePayload.__ascentTrainerSession) {
      rawCandidates.unshift(JSON.stringify(bridgePayload.__ascentTrainerSession));
      window.name = "";
    }
  } catch (_) {
  }

  const candidates = rawCandidates.filter(Boolean);

  for (const raw of candidates) {
    try {
      const storedSession = JSON.parse(raw);
      const session = {
        ...storedSession,
        sessionToken:
          storedSession.sessionToken ||
          storedSession.session_token ||
          storedSession.token ||
          storedSession.accessToken ||
          storedSession.access_token ||
          "",
        trainerUuid:
          storedSession.trainerUuid ||
          storedSession.trainer_uuid ||
          storedSession.staffUuid ||
          storedSession.staff_uuid ||
          storedSession.userUuid ||
          storedSession.user_uuid ||
          storedSession.id ||
          "",
        fullName:
          storedSession.fullName ||
          storedSession.full_name ||
          storedSession.name ||
          "Trainer",
        email:
          storedSession.email ||
          storedSession.email_address ||
          storedSession.emailAddress ||
          "",
        expiresAt:
          storedSession.expiresAt ||
          storedSession.expires_at ||
          "",
        role:
          String(
            storedSession.role ||
            storedSession.globalRole ||
            storedSession.global_role ||
            "TRAINER"
          ).toUpperCase(),
        accessPointUuid:
          storedSession.accessPointUuid ||
          storedSession.access_point_uuid ||
          "",
        accessPointName:
          storedSession.accessPointName ||
          storedSession.access_point_name ||
          "",
        accessPointSlug:
          storedSession.accessPointSlug ||
          storedSession.access_point_slug ||
          ""
      };

      if (!session.sessionToken) {
        continue;
      }

      if (session.expiresAt) {
        const expiryTime = new Date(session.expiresAt).getTime();
        if (Number.isFinite(expiryTime) && expiryTime <= Date.now()) {
          continue;
        }
      }

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(session)
      );
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      console.error(error);
    }
  }

  const notice = document.createElement("div");
  notice.id = "trainerSessionError";
  notice.style.cssText = "position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#102b47;padding:24px;font-family:Arial,sans-serif";
  notice.innerHTML = '<div style="max-width:560px;background:#fff;border-radius:16px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.3)"><h2 style="margin:0 0 12px;color:#143a60">Trainer session did not arrive</h2><p style="margin:0 0 18px;color:#40586e;line-height:1.5">ASCENT reached the Trainer Workspace, but no usable trainer session was available in this browser tab. The page has been kept here instead of sending you back to the Access Point.</p><a href="./" style="display:inline-block;padding:11px 16px;border-radius:10px;background:#143a60;color:#fff;text-decoration:none;font-weight:700">Return to Trainer Login</a></div>';
  document.body.appendChild(notice);
  return null;
}`;

    html = html.replace(
      /    function loadTrainerSession\(\) \{[\s\S]*?\n\}\n\n    function showSection/,
      safeLoader + '\n\n    function showSection'
    );

    if (!html.includes('id="ldTrainingPlanTrainerButton"')) {
      html = html.replace(
        '<button class="nav-item" type="button" data-section="leaderboard">Placement Readiness Board</button>',
        '<button class="nav-item" type="button" data-section="leaderboard">Placement Readiness Board</button>\n          <button id="ldTrainingPlanTrainerButton" class="nav-item" type="button">L&amp;D Training Plan</button>'
      );
    }
    const launch = `<script data-ld-plan-trainer-launch="2026-09-14.1">(function(){function token(){for(const key of ['ascent_trainer_session','ascent_admin_master_session']){try{const s=JSON.parse(localStorage.getItem(key)||'null');const exp=new Date(s?.expiresAt||s?.expires_at||0).getTime();const t=s?.sessionToken||s?.session_token;if(t&&(!Number.isFinite(exp)||exp>Date.now()))return t;}catch(_){}}return '';}function openPlan(){const t=token();if(!t){location.href='./admin-login.html';return;}const f=document.createElement('form');f.method='POST';f.action='./ld-training-plan';f.style.display='none';const i=document.createElement('input');i.type='hidden';i.name='ascent_session_token';i.value=t;f.appendChild(i);document.body.appendChild(f);f.submit();}const b=document.getElementById('ldTrainingPlanTrainerButton');if(b)b.addEventListener('click',openPlan);})();</script>`;
    if (!html.includes('data-ld-plan-trainer-launch')) html = html.replace('</body>', launch + '\n</body>');
    return finish();
  }

  if (isTrainerPortal) {
    if (!html.includes('id="wctPortalAccess"')) {
      const wctAccess = `<a class="btn btn-ghost" id="wctPortalAccess" href="/workplace-communication-test/access.html"><span>Workplace Communication Test</span> ↗</a>`;
      html = html.replace('<a class="btn btn-ghost" href="/app/"><span>Open Practice</span> ↗</a>', wctAccess + '\n    <a class="btn btn-ghost" href="/app/"><span>Open Practice</span> ↗</a>');
    }
    return finish();
  }

  html = html.replace(
    '<a class="navbtn" href="/ascent/trainer-login.html">Trainer Login</a>',
    '<a id="publicTrainerLogin" class="navbtn" href="/ascent/">Trainer Login</a>'
  );
  html = html.replace(
    '<a id="publicTrainerLogin" class="navbtn" href="/ascent/trainer-login.html">Trainer Login</a>',
    '<a id="publicTrainerLogin" class="navbtn" href="/ascent/">Trainer Login</a>'
  );
  if (!html.includes('id="publicTrainerLogin"')) {
    html = html.replace(
      '<a class="navbtn" href="/account/">Register / Log in</a>',
      '<a id="publicTrainerLogin" class="navbtn" href="/ascent/">Trainer Login</a><a class="navbtn" href="/account/">Register / Log in</a>'
    );
  }

  const servicesMenu = `<div class="services-menu">
    <a href="./ascent/"><strong>Trainer Login</strong></a>
    <a href="./quick-jd/">JD Mapper</a>
    <a href="./ascent/jd-builder.html">JD Builder</a>
    <a href="./ascent/cv-builder.html">CV Builder &amp; Evaluator</a>
    <a href="./ascent/eportfolio.html">E-Portfolios</a>
    <a href="./subscribe/?product=CAT_SIMULATOR">CAT Simulator · ₹599 / attempt</a>
    <a href="./subscribe/?product=WCT">Workplace Communication Test · ₹6,500</a>
    <a href="./subscribe/?product=PI_PRACTICE">PI Practice · ₹5,000</a>
    <a href="./subscribe/?product=GD_PRACTICE">GD Practice · ₹7,000</a>
    <a href="./subscribe/?product=PI_LAB">PI Lab · ₹8,000</a>
    <a href="./subscribe/?product=GD_LAB">GD Lab · ₹8,000</a>
    <a href="./subscribe/?product=DIALOGUE_LAB">Dialogue Lab · ₹8,500</a>
    <a href="./subscribe/?product=PCL">PCL · ₹8,500</a>
    <a href="./subscribe/?product=LIVE_MOCK">Live Mock Interview · ₹12,000</a>
    <a href="./subscribe/?product=PRESENTATION">Presentation Skills · Coming soon</a>
  </div>`;
  html = html.replace(/<div class="services-menu">[\s\S]*?<\/div><\/div><\/div><button id="menuButton"/, servicesMenu + '</div></div><button id="menuButton"');

  const accessSection = `
<section id="public-product-access" class="section alt">
  <div class="shell">
    <div class="section-head">
      <div><div class="kicker">Direct product access</div><h2>Choose the tool. Pay securely. Start the app.</h2></div>
      <p>No ASCENT Access Point or trainer approval is required for these public purchases. Paid access runs for 30 days or the stated usage limit, whichever comes first.</p>
    </div>
    <div class="service-grid">
      ${card('CAT','CAT Simulator','₹599 · one attempt','CAT_SIMULATOR')}
      ${card('WCT','Workplace Communication Test','₹6,500 · up to 20 AI-active hours / 30 days','WCT')}
      ${card('PI','PI Practice','₹5,000 · up to 20 AI-active hours / 30 days','PI_PRACTICE')}
      ${card('GD','GD Practice','₹7,000 · up to 20 AI-active hours / 30 days','GD_PRACTICE')}
      ${card('PI+','PI Lab','₹8,000 · up to 20 AI-active hours / 30 days','PI_LAB')}
      ${card('GD+','GD Lab','₹8,000 · up to 20 AI-active hours / 30 days','GD_LAB')}
      ${card('DL','Dialogue Lab','₹8,500 · up to 20 AI-active hours / 30 days','DIALOGUE_LAB')}
      ${card('PCL','PCL','₹8,500 · up to 20 AI-active hours / 30 days','PCL')}
      ${card('LIVE','Live Mock Interview','₹12,000 · up to 20 AI-active hours / 30 days','LIVE_MOCK')}
      ${card('PRES','Presentation Skills','Coming soon','PRESENTATION',true)}
    </div>
  </div>
</section>`;

  if (!html.includes('id="public-product-access"')) html = html.replace('<section class="cta">', accessSection + '<section class="cta">');

  html = html.replace(/data-admin-only="1"\s*/g,'').replace(/admin-locked/g,'');
  return finish();
}

function card(icon,name,price,code,soon=false){
  return `<a class="service-card" href="./subscribe/?product=${code}">
    <div class="service-top"><span class="service-icon">${icon}</span><span class="service-kind">${soon?'Coming soon':'Public access'}</span></div>
    <h3>${name}</h3><p><strong>${price}</strong></p>
    <p style="margin-top:8px">${soon?'The course is being completed. Open this page for launch status.':'Secure Razorpay payment, then continue directly to the product.'}</p>
    <span class="go">${soon?'Coming soon →':'Get access →'}</span>
  </a>`;
}
