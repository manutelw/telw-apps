export async function onRequest(context) {
  const response = await context.next();
  if (!response.ok) return response;

  let html = await response.text();
  if (!html.includes('My ASCENT Performance') || html.includes('id="studentToolsPanel"')) {
    return new Response(html, response);
  }

  const styles = `
<style id="studentToolsStyles">
  .student-tools-panel{margin:0 0 22px;padding:20px;border:1px solid var(--border);border-radius:17px;background:#f8fbfe}
  .student-tools-panel h3{margin:0 0 5px;color:var(--navy);font-size:19px}
  .student-tools-panel p{margin:0 0 15px;color:var(--muted);font-size:13px;line-height:1.5}
  .student-tools-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
  .student-tool{min-height:74px;display:flex;align-items:center;justify-content:center;padding:12px;border:1px solid var(--border);border-radius:12px;background:#fff;color:var(--navy);font-size:13px;font-weight:800;text-align:center;transition:.15s ease}
  .student-tool:hover{background:var(--blue-soft);border-color:#b8cddd;transform:translateY(-1px)}
  @media(max-width:900px){.student-tools-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:520px){.student-tools-grid{grid-template-columns:1fr}}
</style>`;
  html = html.replace('</head>', styles + '</head>');

  const panel = `
<section id="studentToolsPanel" class="student-tools-panel" aria-label="Student tools">
  <h3>My Interview &amp; Discussion Tools</h3>
  <p>Open the practice or trainer-assigned tool you need.</p>
  <div class="student-tools-grid">
    <a class="student-tool" href="./practice.html">PI Practice</a>
    <a class="student-tool" href="./practice.html">GD Practice</a>
    <a class="student-tool" href="./jd-interview-mapper.html">JD Interview</a>
    <a class="student-tool" href="./gd-dugout-assignments.html">GD Lab</a>
    <a class="student-tool" href="./pi-lab-access.html">PI Lab</a>
  </div>
</section>`;

  const marker = '<div id="loadingState"';
  if (html.includes(marker)) html = html.replace(marker, panel + '\n\n      ' + marker);

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=UTF-8');
  headers.set('cache-control', 'no-store, max-age=0');
  return new Response(html, {status: response.status, statusText: response.statusText, headers});
}
