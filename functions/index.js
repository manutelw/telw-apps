export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html') || response.status !== 200) return response;

  let html = await response.text();
  const replacement = `<article class="scenario-card role"><div class="scenario-visual"><img src="./assets/quick-practice/role.webp" alt="Professional preparing for a role with a job description" loading="lazy" decoding="async"></div><div class="scenario-body"><div class="scenario-label">JD &amp; Role Prep</div><h3>Preparing for a role?</h3><p>See your JD–CV fit score free, or unlock one complete role-specific mapping.</p><a class="single-action" href="./quick-jd/"><span><strong>Essential · Free</strong><br><small style="font-weight:500;opacity:.78">Mapping score only</small></span><span>→</span></a><a class="single-action" style="margin-top:8px;background:#fff;color:#0b2035;border:1px solid #d9e2e8" href="./quick-jd/?premium=1"><span><strong>Premium · ₹1,500</strong><br><small style="font-weight:500;color:#647687">One full CV–JD combination</small></span><span>→</span></a><a style="display:block;margin-top:10px;color:#123b61;font-size:11px;font-weight:800" href="./ascent/jd-interview-mapper.html">FIIB students · Full mapping included →</a></div></article>`;

  html = html.replace(/<article class="scenario-card role">[\s\S]*?<\/article>/, replacement);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-cache');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
