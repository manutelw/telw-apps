const ASCENT_CACHE = "ascent-play-v1";

const ASCENT_SHELL = [
  "/ascent/play.html",
  "/ascent/offline.html",
  "/ascent/privacy.html",
  "/ascent/delete-account.html",
  "/ascent/icons/ascent-192.png",
  "/ascent/icons/ascent-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(ASCENT_CACHE).then(function (cache) {
      return cache.addAll(ASCENT_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key.startsWith("ascent-play-") && key !== ASCENT_CACHE;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match("/ascent/offline.html");
      })
    );
    return;
  }

  if (ASCENT_SHELL.includes(requestUrl.pathname)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        return cached || fetch(request);
      })
    );
  }
});
