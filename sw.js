// Bump this version string whenever any cached asset changes so old
// clients pick up the new cache and discard stale entries.
const CACHE_VERSION = 'v5';
const CACHE_NAME = `luke-links-${CACHE_VERSION}`;

// Core assets that make up the "app shell". These are pre-cached on
// install so the page can render offline, but at runtime they are always
// served network-first so real updates are picked up immediately instead
// of being stuck behind a stale cache entry.
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/script.js',
  '/assets/js/piano.js',
  '/fa6.6/css/all.css'
];

// Static assets that rarely change - safe to serve cache-first for speed.
const STATIC_ASSETS = [
  '/assets/imagens/profile.jpg',
  '/assets/imagens/favicon.ico',
  '/assets/imagens/icon-192x192.png',
  '/assets/imagens/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache each asset individually so a single failing request (e.g. a
      // 404 or network hiccup) doesn't cause the entire install to fail,
      // which is what cache.addAll() does.
      const allAssets = [...CORE_ASSETS, ...STATIC_ASSETS];
      return Promise.all(
        allAssets.map(url =>
          cache.add(url).catch(err => {
            console.warn('Service worker failed to pre-cache', url, err);
          })
        )
      );
    })
  );
  // Activate the new service worker as soon as it finishes installing.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate update (e.g. from an "Update
// available" prompt) by posting {type: 'SKIP_WAITING'} to the worker.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isCoreAsset(pathname) {
  return CORE_ASSETS.some(asset => pathname === asset || (asset === '/' && pathname === '/'));
}

function isStaticAsset(pathname) {
  return STATIC_ASSETS.some(asset => pathname === asset);
}

// Network-first: try the network so users always get the latest version
// of app-shell files, falling back to cache when offline. The fresh
// response also refreshes the cache for the next offline visit.
function networkFirst(request) {
  return fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then(cached => {
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return undefined;
      })
    );
}

// Cache-first with background refresh (stale-while-revalidate) for
// slow-changing static assets - fast to load, still eventually updates.
function cacheFirst(request) {
  return caches.match(request).then(cached => {
    const fetchPromise = fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() => cached);

    return cached || fetchPromise;
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET requests for same-origin resources; let everything
  // else (POST, cross-origin, etc.) go straight to the network untouched.
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests (HTML page loads) and known core app-shell files
  // always go network-first so deployed updates show up immediately.
  if (request.mode === 'navigate' || isCoreAsset(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Known static, rarely-changing assets use cache-first for speed.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (fonts, other icons, third-party same-origin assets):
  // stale-while-revalidate gives fast loads while keeping cache fresh.
  event.respondWith(cacheFirst(request));
});
