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
  if (!html.includes('>GD Practice</a>')) {
    html = html.replace(
      '<a href="./gd-lab/">GD Lab</a><a href="./pi-lab/">PI Lab</a>',
      '<a href="./gd-lab/learn/">GD Practice</a><a href="./pi-lab/">PI Practice</a><a href="./gd-lab/">GD Lab</a><a href="./pi-lab/">PI Lab</a>'
    );
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
