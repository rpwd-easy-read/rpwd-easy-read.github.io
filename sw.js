/* RPwD Easy Read: service worker for offline support.
 * Caches the app shell, content.json, and all illustration images on first
 * load so the app works offline. Uses a cache-first strategy for images,
 * network-first for HTML/JS/CSS.
 */

const CACHE_NAME = 'rpwd-easy-read-v27';
const SHELL = [
  './',
  'index.html',
  'css/main.css',
  'js/app.js',
  'content.json',
  'manifest.webmanifest',
  'img/icon-192.png',
  'img/icon-512.png',
  'content/training/ch-02.json',
  /* UI-only illustrations no section references: the chapter XV thumb
     and the About page how-to icon are not in the content.json derive
     below, so they must be precached by name or they break offline. */
  'img/illustrations/fund_box.webp',
  'img/illustrations/globe_world.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(SHELL);
        const res = await fetch('content.json');
        const content = await res.json();
        const illustrationURLs = [...new Set(
          content.sections.map((s) => `img/illustrations/${s.illustration}.webp`)
        )];
        await cache.addAll(illustrationURLs);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.webp')) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
      )
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
