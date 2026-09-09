export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const isLanding = url.pathname === '/' || url.pathname === '/index.html';
  const isTrainerPortal = url.pathname === '/portal/trainer/' || url.pathname === '/portal/trainer/index.html';
  const isAdminSettings = url.pathname === '/ascent/admin-settings.html';

  if (!response.ok || (!isLanding && !isTrainerPortal && !isAdminSettings)) {
    return response;
  }

  const host = url.hostname.toLowerCase();
  const supportedHost = host === 'clarionprep.com' || host === 'www.clarionprep.com' || host === 'manuvikraman.com' || host === 'www.manuvikraman.com';
  if (!supportedHost) return response;

  let html = await response.text();

  // Keep the WCT entry visible on the administrator hub without changing ASCENT core files.
  if (isAdminSettings) {
    if (!html.includes('id="wctAdminHubCard"')) {
      const wctCard = `<a id="wctAdminHubCard" class="app-card cv" href="/workplace-communication-test/access.html"><strong>Workplace Communication Test</strong><span>Open the WCT, evaluator dashboard and access controls for trainers and students</span></a>`;
      html = html.replace('<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>', wctCard + '\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
    }
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=UTF-8');
    headers.set('cache-control', 'no-store, max-age=0');
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Add a standalone Workplace Communication Test entry to the trainer/admin portal.
  // This is navigation only and does not connect WCT to ASCENT data or scoring.
  if (isTrainerPortal) {
    if (!html.includes('id="wctPortalAccess"')) {
      const wctAccess = `<a class="btn btn-ghost" id="wctPortalAccess" href="/workplace-communication-test/access.html"><span>Workplace Communication Test</span> ↗</a>`;
      html = html.replace('<a class="btn btn-ghost" href="/app/"><span>Open Practice</span> ↗</a>', wctAccess + '\n    <a class="btn btn-ghost" href="/app/"><span>Open Practice</span> ↗</a>');
    }

    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=UTF-8');
    headers.set('cache-control', 'no-store, max-age=0');
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // PCL and Live Mock remain visible as public information only.
  // Their menu entries scroll to explanatory cards; neither public surface links to the apps.
  const servicesMenu = `<div class="services-menu">
    <a href="./ascent/eportfolio.html">E-Portfolios</a>
    <a href="./ascent/jd-builder.html">JD Builder</a>
    <a href="./ascent/jd-mapper.html">JD Mapper</a>
    <a href="./ascent/cv-builder.html">CV Builder &amp; Evaluator</a>
    <a href="./workplace-communication-test/">Workplace Communication Test · Trainer/Admin</a>
    <a data-admin-only="1" data-admin-href="#service-cat">CAT Simulator · Admin only</a>
    <a data-admin-only="1" data-admin-href="#service-dialogue">Dialogue Lab · Admin only</a>
    <a href="#service-pi-practice">PI Practice</a>
    <a href="#service-gd-practice">GD Practice</a>
    <a href="#service-gd-lab">GD Lab</a>
    <a href="#service-pcl">PCL</a>
    <a href="#service-live-mock">Live Mock Interview</a>
  </div>`;
  html = html.replace(/<div class="services-menu">[\s\S]*?<\/div><\/div><\/div><button id="menuButton"/, servicesMenu + '</div></div><button id="menuButton"');

  // Add the standalone assessment to the visible Services grid without changing ASCENT core.
  if (!html.includes('id="service-workplace-communication-test"')) {
    const assessmentCard = `<a class="service-card" id="service-workplace-communication-test" href="./workplace-communication-test/">
      <span class="service-icon">WCT</span><h3>Workplace Communication Test</h3>
      <p>A 35-minute pre-hire assessment of listening, reading, writing, speaking and workplace judgement.</p>
      <p style="margin-top:10px"><strong>Access:</strong> authorised trainers and administrators only.</p>
      <span class="go">Trainer/Admin sign-in →</span>
    </a>`;
    html = html.replace('<article class="service-card" id="service-pi-practice">', assessmentCard + '<article class="service-card" id="service-pi-practice">');
  }

  // Ensure PCL and Live Mock have public explanatory cards, but never public app links.
  if (!html.includes('id="service-pcl"')) {
    const pclCard = `<article class="service-card" id="service-pcl">
      <span class="service-icon">PCL</span><h3>PCL</h3>
      <p><strong>What it is:</strong> Professional Communication Lab practice for workplace communication, language, judgement and response patterns.</p>
      <p style="margin-top:10px"><strong>Benefits:</strong> Build clearer, more professional workplace communication through guided modules and dialogue practice.</p>
      <p style="margin-top:10px"><strong>Access:</strong> Administrator only. Students, trainers and public visitors cannot open the app.</p>
      <span class="go">Information only · Admin access</span>
    </article>`;
    html = html.replace('<article class="service-card" id="service-cat"', pclCard + '<article class="service-card" id="service-cat"');
  }
  if (!html.includes('id="service-live-mock"')) {
    const liveMockCard = `<article class="service-card" id="service-live-mock">
      <span class="service-icon">LIVE</span><h3>Live Mock Interview</h3>
      <p><strong>What it is:</strong> A realistic spoken mock interview with adaptive follow-ups and performance review.</p>
      <p style="margin-top:10px"><strong>Benefits:</strong> Practise pressure handling, follow-up questions and identify the next improvement priority.</p>
      <p style="margin-top:10px"><strong>Access:</strong> Administrator only. Students, trainers and public visitors cannot open the app.</p>
      <span class="go">Information only · Admin access</span>
    </article>`;
    html = html.replace('<article class="service-card" id="service-cat"', liveMockCard + '<article class="service-card" id="service-cat"');
  }

  // GD lab cards explain access first.
  html = html.replace(/href="\.\/gd-lab\/"/g, 'href="#service-gd-lab"');

  if (!html.includes('id="service-pi-practice"')) {
    const accessSection = `
<section id="practice-simulations" class="section alt">
  <div class="shell">
    <div class="section-head">
      <div class="kicker">Practice &amp; labs</div>
      <h2>What each learner service does, who can use it and how access works.</h2>
      <p>Institutional learners should follow the access route shown for each learner service. Private candidates may request access to eligible learner services by emailing <a href="mailto:manutelw@gmail.com"><strong>manutelw@gmail.com</strong></a>.</p>
    </div>
    <div class="service-grid">
      <article class="service-card" id="service-gd-lab">
        <span class="service-icon">GD+</span><h3>GD Lab</h3>
        <p><strong>What it is:</strong> A trainer-created, role- or JD-specific group-discussion assignment for targeted preparation.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Practise discussion topics that are relevant to the actual opportunity and prepare before the selection process.</p>
        <p style="margin-top:10px"><strong>Who can use it:</strong> Learners selected for a GD Lab assignment. Institutional learners can access it only when a trainer assigns/releases it to them.</p>
        <p style="margin-top:10px"><strong>Private candidates:</strong> Request access at <a href="mailto:manutelw@gmail.com">manutelw@gmail.com</a>.</p>
      </article>
      <article class="service-card" id="service-gd-practice">
        <span class="service-icon">GD</span><h3>GD Practice</h3>
        <p><strong>What it is:</strong> Structured practice for the core GD moves—entering, responding, developing a point, guiding the group and closing.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Build confidence, clearer reasoning and stronger participation before a real GD.</p>
        <p style="margin-top:10px"><strong>Who can use it:</strong> Learners who have been granted GD Practice access. Institutional learners should sign in to ASCENT and use the practice-access application facility.</p>
        <a class="go" href="./ascent/dashboard.html#practiceAccessPanel">Apply for GD Practice access →</a>
        <p style="margin-top:44px"><strong>Private candidates:</strong> Request access at <a href="mailto:manutelw@gmail.com">manutelw@gmail.com</a>.</p>
      </article>
      <article class="service-card" id="service-pi-practice">
        <span class="service-icon">PI</span><h3>PI Practice</h3>
        <p><strong>What it is:</strong> Structured practice for common personal-interview questions with spoken-answer practice and feedback.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Improve answer structure, evidence, clarity and delivery before a real interview.</p>
        <p style="margin-top:10px"><strong>Who can use it:</strong> Learners who have been granted PI Practice access. Institutional learners should sign in to ASCENT and use the practice-access application facility.</p>
        <a class="go" href="./ascent/dashboard.html#practiceAccessPanel">Apply for PI Practice access →</a>
        <p style="margin-top:44px"><strong>Private candidates:</strong> Request access at <a href="mailto:manutelw@gmail.com">manutelw@gmail.com</a>.</p>
      </article>
      <article class="service-card" id="service-dialogue">
        <span class="service-icon">DL</span><h3>Dialogue Lab</h3>
        <p><strong>What it is:</strong> Guided listening-and-speaking practice built around natural workplace and everyday professional dialogues.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Build fluency, listening, usable language and confidence through repeated practice rather than passive study.</p>
      </article>
      <article class="service-card" id="service-pcl">
        <span class="service-icon">PCL</span><h3>PCL</h3>
        <p><strong>What it is:</strong> Professional Communication Lab practice for workplace communication, language, judgement and response patterns.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Build clearer, more professional workplace communication through guided modules and dialogue practice.</p>
        <p style="margin-top:10px"><strong>Access:</strong> Administrator only. Students, trainers and public visitors cannot open the app.</p>
        <span class="go">Information only · Admin access</span>
      </article>
      <article class="service-card" id="service-live-mock">
        <span class="service-icon">LIVE</span><h3>Live Mock Interview</h3>
        <p><strong>What it is:</strong> A realistic spoken mock interview with adaptive follow-ups and performance review.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Practise pressure handling, follow-up questions and identify the next improvement priority.</p>
        <p style="margin-top:10px"><strong>Access:</strong> Administrator only. Students, trainers and public visitors cannot open the app.</p>
        <span class="go">Information only · Admin access</span>
      </article>
    </div>
  </div>
</section>`;
    html = html.replace('<section class="cta">', accessSection + '<section class="cta">');
  }

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=UTF-8');
  headers.set('cache-control', 'no-store, max-age=0');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
