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

  // Keep the public Services menu aligned with the static landing page.
  // PCL and Live Mock are admin-only and must never become learner/private links.
  const servicesMenu = `<div class="services-menu">
    <a href="./ascent/eportfolio.html">E-Portfolios</a>
    <a href="./ascent/jd-builder.html">JD Builder</a>
    <a href="./ascent/jd-mapper.html">JD Mapper</a>
    <a href="./ascent/cv-builder.html">CV Builder &amp; Evaluator</a>
    <a data-admin-only="1" data-admin-href="#service-cat">CAT Simulator · Admin only</a>
    <a data-admin-only="1" data-admin-href="#service-dialogue">Dialogue Lab · Admin only</a>
    <a href="#service-pi-practice">PI Practice</a>
    <a href="#service-pi-lab">PI Lab</a>
    <a href="#service-gd-practice">GD Practice</a>
    <a href="#service-gd-lab">GD Lab</a>
    <a data-admin-only="1" data-admin-href="./ascent/pcl.html">PCL · Admin only</a>
    <a data-admin-only="1" data-admin-href="./ascent/live-mock.html">Live Mock Interview · Admin only</a>
  </div>`;
  html = html.replace(/<div class="services-menu">[\s\S]*?<\/div><\/div><\/div><button id="menuButton"/, servicesMenu + '</div></div><button id="menuButton"');

  // GD/PI lab cards explain access first. Do not rewrite PCL or Live Mock admin locks.
  html = html.replace(/href="\.\/gd-lab\/"/g, 'href="#service-gd-lab"');
  html = html.replace(/href="\.\/pi-lab\/"/g, 'href="#service-pi-lab"');

  if (!html.includes('id="service-pi-practice"')) {
    const accessSection = `
<section id="practice-simulations" class="section alt">
  <div class="shell">
    <div class="section-head">
      <div class="kicker">Practice, labs &amp; live support</div>
      <h2>What each service does, who can use it and how access works.</h2>
      <p>Institutional learners should follow the access route shown for each learner service. Private candidates may request access to eligible learner services by emailing <a href="mailto:manutelw@gmail.com"><strong>manutelw@gmail.com</strong></a>. PCL and Live Mock Interview are administrator-only.</p>
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
      </article>
      <article class="service-card admin-locked" id="service-pcl" aria-disabled="true">
        <span class="service-icon">PCL</span><h3>PCL</h3>
        <p><strong>Administrator only.</strong> PCL is not available to learners, private candidates or trainers as a public-access service.</p>
        <span class="go">Admin only</span>
      </article>
      <article class="service-card admin-locked" id="service-live-mock" aria-disabled="true">
        <span class="service-icon">LIVE</span><h3>Live Mock Interview</h3>
        <p><strong>Administrator only.</strong> Live Mock Interview is not available to learners, private candidates or trainers as a public-access service.</p>
        <span class="go">Admin only</span>
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
