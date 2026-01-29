const CACHE_NAME = 'studypal-v1';
const RUNTIME_CACHE = 'studypal-runtime';

// Static assets for the app shell
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install Event: Cache UI assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Wipe old cache versions
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

// 3. Fetch Event: API logic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // STRATEGY: Network-First for Supabase/API calls
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If successful, update the runtime cache with fresh data
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails (Offline), try the cache
          return caches.match(request);
        })
    );
    return;
  }

  // STRATEGY: Cache-First for static UI assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache new static resources on the fly
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});