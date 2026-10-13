/* ═══════════════════════════════════════
   ARYANA CURRENCY — Service Worker
   ═══════════════════════════════════════ */

const CACHE_VERSION = 'aryana-v1';
const CACHE_NAME = `aryana-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/pages/dashboard.html',
  '/assets/css/theme-v2.css',
  '/assets/css/ui-v2.css',
  '/assets/css/dashboard-v2.css',
  '/assets/css/notifications.css',
  '/assets/css/footer.css',
  '/assets/css/pwa.css',
  '/assets/js/config.js',
  '/assets/js/i18n.js',
  '/assets/js/theme.js',
  '/assets/js/auth.js',
  '/assets/js/api.js',
  '/assets/js/notifications.js',
  '/assets/js/footer.js',
  '/assets/js/pwa.js',
  '/assets/images/logo.png',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
];

// ─── نصب ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ─── فعال‌سازی ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ─── فچ ───
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // فقط GET
  if (request.method !== 'GET') return;

  // API رو کش نکن
  if (request.url.includes('/api/')) return;
  if (request.url.includes('onrender.com')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.destination === 'document') {
            return caches.match('/pages/dashboard.html');
          }
        });
      })
  );
});