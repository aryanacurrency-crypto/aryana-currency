/* ═══════════════════════════════════════
   ARYANA CURRENCY — Service Worker
   Network-First · Auto-Cache-Bust
   ═══════════════════════════════════════ */

const CACHE_VERSION = 'aryana-v' + Date.now();
const CACHE_NAME = `aryana-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/pages/dashboard.html',
  '/assets/css/theme-v2.css',
  '/assets/css/ui-v2.css',
  '/assets/css/dashboard-v2.css',
  '/assets/css/command-palette.css',
  '/assets/css/notifications.css',
  '/assets/css/footer.css',
  '/assets/css/pwa.css',
  '/assets/js/config.js',
  '/assets/js/i18n.js',
  '/assets/js/theme.js',
  '/assets/js/auth.js',
  '/assets/js/api.js',
  '/assets/js/notifications.js',
  '/assets/js/command-palette.js',
  '/assets/js/dashboard.js',
  '/assets/js/footer.js',
  '/assets/js/pwa.js',
  '/assets/images/logo.png',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
];

/* ─── نصب ─── */
self.addEventListener('install', (event) => {
  // فوری فعال شو (نه منتظر بستن تب)
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
});

/* ─── فعال‌سازی ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

/* ─── فچ ─── */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // فقط GET
  if (request.method !== 'GET') return;

  // API رو کش نکن
  if (request.url.includes('/api/')) return;
  if (request.url.includes('onrender.com')) return;

  // ─── Network First (همه چیز از شبکه، اگه نشد از کش) ───
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;

          // Fallback برای ناوبری
          if (request.destination === 'document' || request.mode === 'navigate') {
            return caches.match('/pages/dashboard.html');
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

/* ─── پیام از صفحه (برای update فوری) ─── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});