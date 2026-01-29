const CACHE_NAME = 'studypal-v1';
const RUNTIME_CACHE = 'studypal-runtime';

// Assets to cache immediately on install
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
  // Add other static assets like CSS/JS files here
];

// 1. Install Event: Cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network First Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, PUT, DELETE should never be cached)
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // If the network request is successful, clone it and update the cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), try to serve from cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If even the cache is empty and it's a page navigation, return index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});