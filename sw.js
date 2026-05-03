/* ============================================================
   RecycleRight — Service Worker
   Cache-first for app shell, network-first for external APIs.
   Bump CACHE_VERSION whenever static assets change.
   ============================================================ */

const CACHE_VERSION = 'rr-v1';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './firebase-config.js',
  './js/toast.js',
  './js/sounds.js',
  './js/data.js',
  './js/location.js',
  './js/scanner.js',
  './js/auth.js',
  './js/quiz.js',
  './js/shop.js',
  './js/profile.js',
  './js/app.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-maskable.svg',
];

/* ---- Install: pre-cache app shell ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed:', err))
  );
});

/* ---- Activate: purge old caches ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---- Fetch: cache-first for same-origin, passthrough for external ---- */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Always bypass service worker for:
     - Chrome extensions
     - Non-GET requests (POST to Firestore, etc.)
     - External origins (Firebase, CDNs, fonts, API calls) */
  if (
    request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        /* Serve from cache, revalidate in background */
        const revalidate = fetch(request).then(fresh => {
          if (fresh && fresh.ok) {
            caches.open(CACHE_VERSION).then(c => c.put(request, fresh.clone()));
          }
          return fresh;
        }).catch(() => {});
        return cached;
      }

      /* Not in cache — try network, cache on success */
      return fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(c => c.put(request, clone));
        }
        return response;
      }).catch(() => {
        /* Offline fallback: return index.html for navigation requests */
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
