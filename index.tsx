import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * SERVICE WORKER REMOVAL SYSTEM
 * This block actively unregisters any existing workers and 
 * wipes the Cache Storage to stop the "Serving from cache" behavior.
 */
if ('serviceWorker' in navigator) {
  // 1. Unregister all active service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered a Service Worker');
          // Optional: Force a one-time reload to clear the 'controller' status
          window.location.reload();
        }
      });
    }
  });

  // 2. Clear all named caches (Cache API)
  if (window.caches) {
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => {
        console.log(`Deleting cache: ${name}`);
        return caches.delete(name);
      }));
    }).then(() => {
      console.log('All caches cleared.');
    });
  }
}