import {handleAuth} from './server/auth.mjs';
import {handleDiagnostic} from './server/diagnostic.mjs';
const ORIGIN = 'https://manuvikraman.com', ROOT = '/ielts/writing';
const ASSETS = new Map([[ROOT + '/', '/index.html'], [ROOT + '/app.js', '/app.js'], [ROOT + '/style.css', '/style.css'], [ROOT + '/visuals.js', '/visuals.js']]);
export default {async fetch(request, env) {
  const url = new URL(request.url);
  if (url.origin !== ORIGIN) return new Response('Not found', {status: 404});
  if (url.pathname === ROOT && ['GET', 'HEAD'].includes(request.method)) return new Response(null, {status: 308, headers: {location: ROOT + '/'}});
  if (!url.pathname.startsWith(ROOT + '/')) return new Response('Not found', {status: 404});
  let response = await handleAuth(request, env) || await handleDiagnostic(request, env);
  if (!response) {
    if (!['GET', 'HEAD'].includes(request.method) || !ASSETS.has(url.pathname)) response = new Response('Not found', {status: 404});
    else {
      const asset = new URL(request.url); asset.pathname = ASSETS.get(url.pathname);
      response = await env.ASSETS.fetch(new Request(asset, request));
    }
  }
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'private, no-store, max-age=0');
  headers.set('referrer-policy', 'same-origin');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
  return new Response(request.method === 'HEAD' ? null : response.body, {status: response.status, headers});
}};
