/**
 * SahyogAI Production Service Worker (Offline-First Architecture)
 * Visakhapatnam (Vizag), Andhra Pradesh — Disaster Emergency Grid
 * Powered by Antigravity AI Engine
 * ----------------------------------------------------------------
 * Handles:
 *  1. App Shell Pre-Caching (Cache-First / Stale-While-Revalidate for UI assets)
 *  2. Smart Network-First with Cache Fallback for all GET /api/ requests
 *  3. Automatic Cache Versioning & Stale Cache Eviction on activate
 *  4. Background Sync & Client Broadcast on network state recovery
 *  5. Offline emergency response synthetic fallback
 */

const SHELL_CACHE_NAME = 'sahyog-vizag-shell-v4';
const API_CACHE_NAME = 'sahyog-vizag-api-cache-v2';

// Static assets required for complete zero-connectivity app shell boot
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline/offlineDB.js',
  '/offline/syncEngine.js',
  '/offline/OfflineStatusBanner.js',
  // Third-party CDN libraries cached for offline field autonomy
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js'
];

// --- 1. INSTALL LIFECYCLE ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then(async (cache) => {
      const cachePromises = SHELL_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { mode: url.startsWith('http') && !url.includes(self.location.hostname) ? 'cors' : 'same-origin' });
          if (response.ok || response.type === 'opaque') {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn(`[SW] Pre-cache asset skipped (${url}):`, err.message);
        }
      });
      await Promise.all(cachePromises);
    }).then(() => self.skipWaiting())
  );
});

// --- 2. ACTIVATE LIFECYCLE ---
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log(`[SW] Evicting deprecated cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// --- 3. FETCH INTERCEPTION & STRATEGIES ---
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // SSE (Server-Sent Events) live streams cannot be cached
  if (url.pathname.includes('/api/events')) {
    return;
  }

  // A. GET API REQUESTS: Network-First with Cache Fallback
  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            const modifiedHeaders = new Headers(cachedResponse.headers);
            modifiedHeaders.set('X-Sahyog-Offline', 'true');
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: modifiedHeaders,
            });
          }

          // Fallback optimistic structure when never cached before
          return new Response(
            JSON.stringify({
              success: true,
              offlineFallback: true,
              data: [],
              operationalSector: 'Visakhapatnam (Vizag), Andhra Pradesh',
              message: 'Operating in Antigravity offline mode. Displaying localized cache.',
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Sahyog-Offline': 'true',
              },
            }
          );
        })
    );
    return;
  }

  // B. NON-GET REQUESTS (POST, PUT, PATCH, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // C. NAVIGATION REQUESTS (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html') || await caches.match('/');
          return cached || new Response('Offline Mode - Visakhapatnam Disaster Portal shell unavailable.', { status: 503 });
        })
    );
    return;
  }

  // D. STATIC UI ASSETS: Cache-First with Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          const clone = networkResponse.clone();
          caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => null);

      return cached || fetchPromise;
    })
  );
});

// --- 4. BACKGROUND SYNC EVENT ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-outbox-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' });
        });
      })
    );
  }
});

// --- 5. CLIENT COMMUNICATION & SKIP WAITING ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
