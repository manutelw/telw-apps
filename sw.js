// CLARION Service Worker v2
// Bump CACHE_NAME whenever you deploy a new build to force cache refresh.
const CACHE_NAME = 'clarion-v2';

// Shell assets to pre-cache on install.
// All paths are absolute from root so they work regardless of how the SW is triggered.
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
// Pre-cache the app shell. Each URL is attempted independently so a single
// failure (e.g. a font CDN being offline) does not block installation.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        PRECACHE.map(url =>
          fetch(url, { cache: 'reload' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => { /* ignore individual failures */ })
        )
      )
    ).then(() => self.skipWaiting())   // activate immediately
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
// Delete every cache that isn't the current version, then take control of all
// open tabs without requiring a page reload.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET over http/https
  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Never intercept AI API calls — they must always go to the network
  if (
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('anthropic.com')
  ) return;

  // Google Fonts — network-first, no cache (they have their own cache headers)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 408 })));
    return;
  }

  // ── Navigation requests (page loads) ──────────────────────────────────────
  // Strategy: network-first. On failure, serve the cached index.html so the
  // app always opens even if the user is offline. Never return undefined.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            // Update the cache with the freshest copy
            caches.open(CACHE_NAME).then(c => c.put('/', res.clone()));
          }
          return res;
        })
        .catch(() =>
          // Offline fallback — return cached root
          caches.match('/index.html')
            .then(cached => cached || caches.match('/'))
            .then(cached => cached || new Response(
              '<h1>CLARION is offline</h1><p>Please reconnect and reload.</p>',
              { headers: { 'Content-Type': 'text/html' } }
            ))
        )
    );
    return;
  }

  // ── Static assets (icons, manifest, etc.) ─────────────────────────────────
  // Strategy: cache-first, then network. If both fail, return a safe empty
  // response so we never pass undefined to respondWith().
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          // Only cache valid same-origin responses
          if (res && res.ok && res.type === 'basic') {
            caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() =>
          // Safe fallback — never undefined
          new Response('', { status: 503, statusText: 'Service Unavailable' })
        );
    })
  );
});

// ── MESSAGE ───────────────────────────────────────────────────────────────────
// Allow the page to trigger a cache bust + reload via postMessage.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
