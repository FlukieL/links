const CACHE_NAME = 'luke-links-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/script.js',
  '/assets/js/piano.js',
  '/assets/imagens/profile.jpg',
  '/assets/imagens/favicon.ico',
  '/assets/imagens/icon-192x192.png',
  '/assets/imagens/icon-512x512.png',
  '/fa6.6/css/all.css'
];

self.addEventListener('install', event => {
  // Allow the service worker to activate immediately, even if caching fails
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => {
        console.error('Service worker cache failed:', err);
        // Don't block installation if caching fails
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if available, otherwise fetch
        if (response) {
          return response;
        }
        return fetch(event.request).then(fetchResponse => {
          // Don't cache if not a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }
          // Clone the response for caching
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        }).catch(() => {
          // If fetch fails and no cache, return a basic offline response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Activate event: clean up old caches, then claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
