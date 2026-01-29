const CACHE_NAME = 'studypal-v1';
const RUNTIME_CACHE = 'studypal-runtime';

// 1. Skip pre-caching assets on install
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});

// 2. Clear out all old caches when this new service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// 3. Network-only fetch strategy
self.addEventListener('fetch', (event) => {
  // If you want to bypass the service worker entirely for certain requests, 
  // you can just return and let the browser handle it normally.
  event.respondWith(fetch(event.request));
});