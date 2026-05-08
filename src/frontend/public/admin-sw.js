// Imperidome Admin Service Worker
// Scoped to /admin/ only — does not intercept public site or client portal.

const CACHE_NAME = 'imperidome-admin-v1';

// Core shell assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/admin/login',
];

// ─── Install: precache core admin shell ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: routing strategy ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const { pathname } = url;

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return; // let browser handle cross-origin (fonts, CDN, etc.)
  }

  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const isStaticAsset = /\.(js|css|woff|woff2|png|svg|ico|jpg|jpeg|webp|gif)(\?.*)?$/.test(pathname);

  // ── Pass-through: not an admin path and not a static asset ────────────────
  if (!isAdminPath && !isStaticAsset) {
    // Public site and portal pages — do not interfere
    return;
  }

  // ── Admin navigation requests — serve index.html (SPA fallback) ──────────
  // Handles PWA direct-launch and hard refreshes on /admin sub-routes.
  if (isAdminPath && event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          // Network failed (offline or 404) — fall back to cached index.html
          caches.match('/index.html').then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // ── Admin HTML (non-navigate, e.g. prefetch) — Network-first ─────────────
  const acceptHeader = event.request.headers.get('accept') || '';
  if (isAdminPath && acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match(event.request)))
    );
    return;
  }

  // ── Static assets — Cache-first ───────────────────────────────────────────
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Admin non-HTML (API calls, etc.) — Network-first ─────────────────────
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Push: display native notification ───────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Imperidome', body: 'New notification', url: '/admin/dashboard' };
  try {
    data = event.data ? event.data.json() : data;
  } catch (_e) {
    // payload is not JSON — use defaults
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/admin-icon-192.png',
    badge: '/admin-icon-192.png',
    data: { url: data.url || '/admin/dashboard' },
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Imperidome Admin', options)
  );
});

// ─── Notification click: open or focus admin panel ───────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If admin panel already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Message: handle SKIP_WAITING from frontend ───────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
