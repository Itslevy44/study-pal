/* sw.js - Service Worker Self-Destruct Script */

self.addEventListener('install', (event) => {
  // Force the new "kill" worker to take over immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Unregister this service worker from the browser
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      // Force all open tabs to reload so they are no longer controlled
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    });

  // Delete every single cache storage folder (Purge everything)
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    })
  );
});

// Immediately pass all fetches to the live network
self.addEventListener('fetch', (event) => {
  return; 
});