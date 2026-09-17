/*
 * Offline cache. The point of this tool is that it keeps working with the
 * network unplugged, so the whole site is precached on first visit.
 *
 * Nothing you do on the page is cached, because nothing you do on the page
 * leaves the page. This only ever stores the site's own files.
 */
importScripts("/build-info.js");

const VERSION = (self.BUILD_INFO && self.BUILD_INFO.buildNumber) || "dev";
const CACHE = `encrypttool-v${VERSION}`;

const PRECACHE = [
  "/",
  "/styles.css",
  "/methods.js",
  "/recommend.js",
  "/printables.js",
  "/app.js",
  "/build-info.js",
  "/wordlist.js",
  "/favicon.svg",
  "/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || (request.mode === "navigate" ? caches.match("/") : undefined));

      return cached || network;
    }),
  );
});
