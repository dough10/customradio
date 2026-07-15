const CACHE_VERSION = '1.14.0';
const urlsToCache = [];

const bypassPaths = [
  '/info',
  '/report/play/',
  '/report/list/',
  '/auth',
  '/auth/callback',
  '/alerts',
  '/stations/update',
  '/stations/scrape',
  '/stations/duplicates',
  '/stations/duplicates/mark',
  '/stations/duplicates/unmark',
];

const shouldBypassCache = url =>
  bypassPaths.some(path => url.includes(path));

const appRoutes = [
  '/stations',
  '/stations/topGenres',
  '/stations/user',
];

const isAppRoute = url =>
  appRoutes.some(path => url.includes(path));

/**
 * Handles fetch requests
 * Returns cached response if offline.
 * 
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response from cache or network.
 */
async function handleRequest(event) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const networkResponse = await fetch(event.request);
    const clonedResponse = networkResponse.clone();
    await cache.put(event.request, clonedResponse);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (shouldBypassCache(url)) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (
    event.request.headers.get('Accept')?.includes('text/html') ||
    isAppRoute(url)
  ) {
    event.respondWith(handleRequest(event));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_VERSION];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('push', function (event) {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'android-chrome-192.png',
      badge: 'badge.png',
      data: {
        url: data.url
      }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
