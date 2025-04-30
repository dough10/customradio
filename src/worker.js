const CACHE_VERSION = '1.12.0';
const urlsToCache = [];

/**
 * Handles fetch requests for /stations.
 * Checks if the cache is older than 24 hours and updates it if necessary.
 * 
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response from cache or network.
 */
async function handleStationsRequest(event) {
  const cache = await caches.open(CACHE_VERSION);
  const cachedResponse = await cache.match(event.request);
  const now = Date.now();

  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date'));

    if ((now - cachedDate.getTime()) < 24 * 60 * 60 * 1000) {
      return cachedResponse;
    }
  }

  const networkResponse = await fetch(event.request);
  const clonedResponse = networkResponse.clone();
  const headers = new Headers(clonedResponse.headers);
  headers.set('sw-cache-date', new Date(now).toISOString());

  const responseToCache = new Response(clonedResponse.body, {
    status: clonedResponse.status,
    statusText: clonedResponse.statusText,
    headers: headers,
  });

  await cache.put(event.request, responseToCache);
  return networkResponse;
}

/**
 * Handles fetch requests for /topGenres.
 * Returns cached response if offline.
 * 
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response from cache or network.
 */
async function handleTopGenresRequest(event) {
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
  if (event.request.url.includes('/stations')) {
    event.respondWith(handleStationsRequest(event));
  } else if (event.request.url.includes('/topGenres')) {
    event.respondWith(handleTopGenresRequest(event));
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
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

self.addEventListener('push', function(event) {
  const data = event.data.json(); // your server sends JSON

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'android-chrome-192.png',
      badge: 'badge.png',
      data: {
        url: data.url // you can open this when clicked
      }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if app is already open
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
