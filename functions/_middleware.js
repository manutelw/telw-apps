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

  const menuNeedle = '<a href="./gd-lab/">GD Lab</a><a href="./pi-lab/">PI Lab</a>';
  const menuReplacement = '<a data-admin-only="1" data-admin-href="#service-cat">CAT Simulator · Admin only</a><a data-admin-only="1" data-admin-href="#service-dialogue">Dialogue Lab · Admin only</a><a href="#service-pi-practice">PI Practice</a><a href="#service-pi-lab">PI Lab</a><a href="#service-gd-practice">GD Practice</a><a href="#service-gd-lab">GD Lab</a>';
  if (html.includes(menuNeedle)) html = html.replace(menuNeedle, menuReplacement);

  html = html.replace('href="./gd-lab/"', 'href="#service-gd-lab"');
  html = html.replace('href="./pi-lab/"', 'href="#service-pi-lab"');

  if (!html.includes('id="service-pi-practice"')) {
    const accessSection = `
<section id="practice-simulations" class="section alt">
  <div class="shell">
    <div class="section-head">
      <div class="kicker">Practice &amp; simulations</div>
      <h2>See what each practice tool does before you ask for access.</h2>
      <p>Institutional and private learners follow different access rules. Sign in through ASCENT so the correct rule is applied to your account.</p>
    </div>
    <div class="service-grid">
      <article class="service-card" id="service-pi-practice">
        <span class="service-icon">PI</span><h3>PI Practice</h3>
        <p>Practise common personal-interview questions, record your answers and improve how clearly you present your evidence.</p>
        <p style="margin-top:10px"><strong>FIIB:</strong> apply first; access can be approved after 24 hours. <strong>Private/non-FIIB:</strong> paid access opens under the private learner rules.</p>
        <a class="go" href="./ascent/dashboard.html#practiceAccessPanel">Apply for access →</a>
      </article>
      <article class="service-card" id="service-pi-lab">
        <span class="service-icon">PI+</span><h3>PI Lab</h3>
        <p>Prepare for a specific company and role using the uploaded JD, interviewer questions and model candidate responses.</p>
        <p style="margin-top:10px">This is trainer-assigned. Access is given only to learners included in the Excel roster uploaded with that PI assignment.</p>
        <a class="go" href="./ascent/dashboard.html">Check my PI Lab access →</a>
      </article>
      <article class="service-card" id="service-gd-practice">
        <span class="service-icon">GD</span><h3>GD Practice</h3>
        <p>Learn and practise the core GD moves: enter, respond, develop, guide and close. Hear models, repeat them and improve your delivery.</p>
        <p style="margin-top:10px"><strong>FIIB:</strong> apply first; access can be approved after 24 hours. <strong>Private/non-FIIB:</strong> paid access opens under the private learner rules.</p>
        <a class="go" href="./ascent/dashboard.html#practiceAccessPanel">Apply for access →</a>
      </article>
      <article class="service-card" id="service-gd-lab">
        <span class="service-icon">GD+</span><h3>GD Lab</h3>
        <p>Take part in a live, continuous JD-based group discussion with AI participants and receive feedback on your own contribution.</p>
        <p style="margin-top:10px">This is trainer-assigned. Access is given only to learners included in the Excel roster uploaded with that GD assignment.</p>
        <a class="go" href="./ascent/gd-dugout-assignments.html">Check my GD Lab access →</a>
      </article>
      <article class="service-card" id="service-cat">
        <span class="service-icon">CAT</span><h3>CAT Simulator</h3>
        <p>Run CAT-style timed practice across VARC, DILR and QA in a realistic simulation environment.</p>
        <p style="margin-top:10px">This service is currently available to ASCENT administrators only.</p>
        <a class="go" data-admin-only="1" data-admin-href="https://cat.clarionprep.com/">Open CAT Simulator · Admin only</a>
      </article>
      <article class="service-card" id="service-dialogue">
        <span class="service-icon">DL</span><h3>Dialogue Lab</h3>
        <p>Build spoken communication through guided dialogues, listening models and repeated learner practice.</p>
        <p style="margin-top:10px">This service is currently available to ASCENT administrators only.</p>
        <a class="go" data-admin-only="1" data-admin-href="./dialogue-lab/home.html">Open Dialogue Lab · Admin only</a>
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
