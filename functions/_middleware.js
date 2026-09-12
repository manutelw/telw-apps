export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const isLanding = url.pathname === '/' || url.pathname === '/index.html';
  const isTrainerPortal = url.pathname === '/portal/trainer/' || url.pathname === '/portal/trainer/index.html';
  const isAdminSettings = url.pathname === '/ascent/admin-settings.html';

  if (!response.ok || (!isLanding && !isTrainerPortal && !isAdminSettings)) return response;

  const host = url.hostname.toLowerCase();
  const supportedHost = host === 'clarionprep.com' || host === 'www.clarionprep.com' || host === 'manuvikraman.com' || host === 'www.manuvikraman.com';
  if (!supportedHost) return response;

  let html = await response.text();
  const finish = () => {
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=UTF-8');
    headers.set('cache-control', 'no-store, max-age=0');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  };

  // Keep existing administrator routes intact.
  if (isAdminSettings) {
    if (!html.includes('id="wctAdminHubCard"')) {
      const wctCard = `<a id="wctAdminHubCard" class="app-card cv" href="/workplace-communication-test/access.html"><strong>Workplace Communication Test</strong><span>Open the WCT, evaluator dashboard and access controls for trainers and students</span></a>`;
      html = html.replace('<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>', wctCard + '\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
    }
    return finish();
  }

  if (isTrainerPortal) {
    if (!html.includes('id="wctPortalAccess"')) {
      const wctAccess = `<a class="btn btn-ghost" id="wctPortalAccess" href="/workplace-communication-test/access.html"><span>Workplace Communication Test</span> ↗</a>`;
      html = html.replace('<a class="btn btn-ghost" href="/app/"><span>Open Practice</span> ↗</a>', wctAccess + '\n    <a class="btn btn-ghost" href="/app/"><span>Open Practice</span> ↗</a>');
    }
    return finish();
  }

  // Public visitors go from ClarionPrep -> product access/payment -> product.
  // Existing institutional/admin entry routes remain separate and unchanged.
  const servicesMenu = `<div class="services-menu">
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

  // Remove public-only lock styling from product cards/menu; admin security remains unchanged.
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
