/**
 * BarberZap Service Worker
 *
 * Offline support and automatic sync
 * Part of FASE 3.1 - Service Worker for Offline
 *
 * Features:
 * - Cache first for assets
 * - Network first for API calls (when online)
 * - Queue offline API calls for sync when back online
 * - Progressive Web App (PWA) support
 */

const CACHE_NAME = 'barberzap-v1';
const CACHE_VERSION = 1;

const URLs_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

const API_CACHE_NAME = 'barberzap-api-v1';

/**
 * Install event: Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(URLs_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event: Clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event: Handle requests
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls: Network first with fallback to cached offline responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
  }
  // Static assets: Cache first
  else if (url.pathname.startsWith('/static/') ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.jpg') ||
           url.pathname.endsWith('.png') ||
           url.pathname.endsWith('.svg')) {
    event.respondWith(handleStaticRequest(event.request));
  }
  // Pages: Network first with offline fallback
  else {
    event.respondWith(handlePageRequest(event.request));
  }
});

/**
 * Handle API requests (network first)
 */
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    // If offline and POST/UPDATE/DELETE request, queue for later sync
    if (!cachedResponse && (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE')) {
      await queueOfflineRequest(request);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Request queued for offline sync',
          queued: true
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return cachedResponse || new Response(
      JSON.stringify({ error: 'No cached data available' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle static requests (cache first)
 */
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch and cache
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    return new Response('Static asset not available offline', { status: 503 });
  }
}

/**
 * Handle page requests (network first with offline fallback)
 */
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful page responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return caches.match('/offline.html');
  }
}

/**
 * Queue offline API requests for sync
 */
const OFFLINE_REQUESTS_DB = 'barberzap-offline-requests';

async function queueOfflineRequest(request) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OFFLINE_REQUESTS_DB, 1);

    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };

    openRequest.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');

      const offlineRequest = {
        url: request.url,
        method: request.method,
        body: await request.text(),
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: Date.now()
      };

      store.add(offlineRequest);
      resolve();
    };

    openRequest.onerror = () => reject(openRequest.error);
  });
}

/**
 * Sync offline requests when back online
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

async function syncOfflineRequests() {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OFFLINE_REQUESTS_DB, 1);

    openRequest.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');

      const requests = await new Promise((resolve, reject) => {
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });

      for (const offlineRequest of requests) {
        try {
          const response = await fetch(offlineRequest.url, {
            method: offlineRequest.method,
            headers: offlineRequest.headers,
            body: offlineRequest.body
          });

          if (response.ok) {
            store.delete(offlineRequest.id);
          }
        } catch (error) {
          console.error('[SW] Failed to sync offline request:', error);
        }
      }

      resolve();
    };

    openRequest.onerror = () => reject(openRequest.error);
  });
}

/**
 * Handle online/offline events
 */
self.addEventListener('online', () => {
  console.log('[SW] Online - sync pending requests');
  self.registration.sync.register('sync-offline-requests');
});

self.addEventListener('offline', () => {
  console.log('[SW] Offline - queueing requests');
});
