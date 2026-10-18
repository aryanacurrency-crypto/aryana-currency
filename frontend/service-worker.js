/* ═══════════════════════════════════════
   ARYANA CURRENCY — Service Worker v2
   Network-First · Cache-Busting · Admin-Aware
   ═══════════════════════════════════════ */

/* ⚠️ هر بار که فایل‌های CSS/JS رو تغییر دادی، این عدد رو +1 کن */
const CACHE_VERSION = 'v3';
const CACHE_NAME = `aryana-cache-${CACHE_VERSION}`;

/* ─── فایل‌هایی که همیشه باید کش بشن (App Shell) ─── */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/pages/dashboard.html',
  '/pages/login.html',
  '/pages/register.html',
  '/pages/404.html',

  /* CSS */
  '/assets/css/theme-v2.css',
  '/assets/css/ui-v2.css',
  '/assets/css/dashboard-v2.css',
  '/assets/css/command-palette.css',
  '/assets/css/notifications.css',
  '/assets/css/footer.css',
  '/assets/css/pwa.css',
  '/assets/css/pages-v2.css',
  '/assets/css/auth-v2.css',

  /* JS */
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
  '/assets/js/login.js',
  '/assets/js/register.js',

  /* Images */
  '/assets/images/logo.png',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
];

/* ─── فایل‌های Admin (کش جداگانه — فقط اولین بار که باز شد) ─── */
const ADMIN_ASSETS = [
  '/pages/admin/index.html',
  '/pages/admin/users.html',
  '/pages/admin/orders.html',
  '/pages/admin/order-detail.html',
  '/pages/admin/kyc.html',
  '/pages/admin/withdrawals.html',
  '/pages/admin/rates.html',
  '/pages/admin/settings.html',
  '/pages/admin/wheel-settings.html',
  '/pages/admin/p2p-orders.html',
  '/pages/admin/p2p-order-detail.html',

  '/assets/css/admin-v2.css',
  '/assets/css/admin-fix.css',
  '/assets/css/wheel-admin-v2.css',
  '/assets/css/p2p.css',

  '/assets/js/admin-v2/common.js',
  '/assets/js/admin-v2/dashboard.js',
  '/assets/js/admin-v2/users.js',
  '/assets/js/admin-v2/orders.js',
  '/assets/js/admin-v2/order-detail.js',
  '/assets/js/admin-v2/kyc.js',
  '/assets/js/admin-v2/withdrawals.js',
  '/assets/js/admin-v2/rates.js',
  '/assets/js/admin-v2/settings.js',
  '/assets/js/admin-v2/wheel-settings.js',
  '/assets/js/admin-v2/p2p-orders.js',
  '/assets/js/admin-v2/p2p-order-detail.js',
];

/* ═══════════════════════════════════════
   INSTALL
   ═══════════════════════════════════════ */
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // اول CORE رو کش کن، بعد ADMIN (اگه شکست خورد، ادامه بده)
      return cache
        .addAll(CORE_ASSETS)
        .catch((err) => {
          console.warn('[SW] Some CORE assets failed:', err);
        })
        .then(() => cache.addAll(ADMIN_ASSETS))
        .catch((err) => {
          console.warn('[SW] Some ADMIN assets failed:', err);
        });
    })
  );
});

/* ═══════════════════════════════════════
   ACTIVATE
   ═══════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/* ═══════════════════════════════════════
   FETCH — Network First + Cache Fallback
   ═══════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // فقط GET
  if (request.method !== 'GET') return;

  // API و Render رو کش نکن
  if (request.url.includes('/api/')) return;
  if (request.url.includes('onrender.com')) return;

  // Don't cache external resources (Google Fonts, etc.) - let browser handle
  if (!request.url.startsWith(self.location.origin)) return;

  // Network First
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

          // Fallback برای navigation
          if (request.mode === 'navigate' || request.destination === 'document') {
            // اگه URL شامل /pages/admin/ بود، به admin/index.html
            if (request.url.includes('/pages/admin/')) {
              return caches.match('/pages/admin/index.html');
            }
            return caches.match('/pages/dashboard.html');
          }

          // Fallback برای CSS/JS
          if (request.destination === 'style' || request.destination === 'script') {
            return new Response('', {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/plain' },
            });
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

/* ═══════════════════════════════════════
   MESSAGE (از صفحه)
   ═══════════════════════════════════════ */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
  }
});