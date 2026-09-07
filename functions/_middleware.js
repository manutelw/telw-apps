export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);

  if (!response.ok || (url.pathname !== '/' && url.pathname !== '/index.html')) {
    return response;
  }

  const host = url.hostname.toLowerCase();
  const supportedHost = host === 'clarionprep.com' || host === 'www.clarionprep.com' || host === 'manuvikraman.com' || host === 'www.manuvikraman.com';
  if (!supportedHost) return response;

  let html = await response.text();

  // Public Services menu: keep the user-defined order. The repeated Dialogue Lab
  // entry is intentionally retained because it appears twice in the supplied list.
  // Workplace Communication Test is a standalone ClarionPrep assessment add-on.
  const servicesMenu = `<div class="services-menu">
    <a href="./ascent/eportfolio.html">EP</a>
    <a href="./ascent/jd-builder.html">JD Builder</a>
    <a href="./ascent/jd-mapper.html">JD Mapper</a>
    <a href="./ascent/cv-builder.html">CV Builder &amp; Evaluator</a>
    <a href="./workplace-communication-test/">Workplace Communication Test</a>
    <a href="#service-gd-lab">GD Lab</a>
    <a href="#service-gd-practice">GD Practice</a>
    <a href="#service-pi-lab">PI Lab</a>
    <a href="#service-pi-practice">PI Practice</a>
    <a href="#service-dialogue">Dialogue Lab</a>
    <a href="#service-pcl">PCL</a>
    <a href="#service-live-mock">Live Mock Interview</a>
    <a href="#service-dialogue">Dialogue Lab</a>
  </div>`;
  html = html.replace(/<div class="services-menu">[\s\S]*?<\/div><\/div><\/div><button id="menuButton"/, servicesMenu + '</div></div><button id="menuButton"');

  // Add the standalone assessment to the visible Services grid without changing ASCENT core.
  if (!html.includes('id="service-workplace-communication-test"')) {
    const assessmentCard = `<a class="service-card" id="service-workplace-communication-test" href="./workplace-communication-test/">
      <span class="service-icon">WCT</span><h3>Workplace Communication Test</h3>
      <p>A 35-minute pre-hire assessment of listening, reading, writing, speaking and workplace judgement.</p>
      <span class="go">Open the assessment →</span>
    </a>`;
    html = html.replace('<article class="service-card" id="service-pi-practice">', assessmentCard + '<article class="service-card" id="service-pi-practice">');
  }

  // The landing-page cards for these services should explain access first rather
  // than taking a visitor directly into the app.
  html = html.replace(/href="\.\/gd-lab\/"/g, 'href="#service-gd-lab"');
  html = html.replace(/href="\.\/pi-lab\/"/g, 'href="#service-pi-lab"');
  html = html.replace(/data-admin-only="1" data-admin-href="\.\/ascent\/pcl\.html"/g, 'href="#service-pcl"');
  html = html.replace(/data-admin-only="1" data-admin-href="\.\/ascent\/live-mock\.html"/g, 'href="#service-live-mock"');
  html = html.replace(/<span class="go">Admin only<\/span>/g, '<span class="go">See access details →</span>');

  if (!html.includes('id="service-pi-practice"')) {
    const accessSection = `
<section id="practice-simulations" class="section alt">
  <div class="shell">
    <div class="section-head">
      <div class="kicker">Practice, labs &amp; live support</div>
      <h2>What each service does, who can use it and how access works.</h2>
      <p>Institutional learners should follow the access route shown for each service. Private candidates may request access to any of these services by emailing <a href="mailto:manutelw@gmail.com"><strong>manutelw@gmail.com</strong></a>.</p>
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
      <article class="service-card" id="service-pi-lab">
        <span class="service-icon">PI+</span><h3>PI Lab</h3>
        <p><strong>What it is:</strong> A trainer-created, JD-specific interview assignment built around a company, role and targeted PI questions.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Focus preparation on the interview that is actually coming up instead of practising generic questions only.</p>
        <p style="margin-top:10px"><strong>Who can use it:</strong> Learners selected for a PI Lab assignment. Institutional learners can access it only when a trainer assigns/releases it to them.</p>
        <p style="margin-top:10px"><strong>Private candidates:</strong> Request access at <a href="mailto:manutelw@gmail.com">manutelw@gmail.com</a>.</p>
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
        <p style="margin-top:10px"><strong>Who can use it:</strong> Learners for whom Dialogue Lab access has been enabled by their programme or administrator.</p>
        <p style="margin-top:10px"><strong>Private candidates:</strong> Request access at <a href="mailto:manutelw@gmail.com">manutelw@gmail.com</a>.</p>
      </article>
      <article class="service-card" id="service-pcl">
        <span class="service-icon">PCL</span><h3>PCL</h3>
        <p><strong>What it is:</strong> Professional Communication Lab practice for handling workplace communication clearly and appropriately.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Strengthen the language, judgement and response patterns needed in professional situations.</p>
        <p style="margin-top:10px"><strong>Who can use it:</strong> Learners whose institution, trainer or administrator has enabled PCL access.</p>
        <p style="margin-top:10px"><strong>Private candidates:</strong> Request access at <a href="mailto:manutelw@gmail.com">manutelw@gmail.com</a>.</p>
      </article>
      <article class="service-card" id="service-live-mock">
        <span class="service-icon">LIVE</span><h3>Live Mock Interview</h3>
        <p><strong>What it is:</strong> A realistic spoken mock interview with follow-up questions and performance review.</p>
        <p style="margin-top:10px"><strong>Benefits:</strong> Test preparation under interview pressure, practise handling follow-ups and identify the next improvement priority.</p>
        <p style="margin-top:10px"><strong>Who can use it:</strong> Learners for whom Live Mock Interview access has been enabled by their programme, trainer or administrator.</p>
        <p style="margin-top:10px"><strong>Private candidates:</strong> Request access at <a href="mailto:manutelw@gmail.com">manutelw@gmail.com</a>.</p>
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