/* sw.js - Service Worker Self-Destruct */

self.addEventListener('install', (event) => {
  // Immediately take over and skip the waiting phase
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Unregister the service worker
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    });

  // Delete all caches associated with this domain
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    })
  );
});

// Immediately pass all requests through to the network without looking at cache
self.addEventListener('fetch', (event) => {
  return; 
});