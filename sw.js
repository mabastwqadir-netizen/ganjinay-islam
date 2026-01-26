const CACHE_NAME = 'islamic-treasure-v2'; // Bump version
const STATIC_ASSETS = [
    '/', // Alias for index.html
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    '/js/theme.js',
    '/assets/logo.png',
    '/aqidah/index.html',
    '/biography/index.html',
    '/companions/index.html',
    '/dhikr/index.html',
    '/faq/index.html',
    '/hadiths/index.html',
    '/islam-what/index.html',
    '/library-media/index.html',
    '/prayer/index.html',
    '/quran/index.html',
    '/quran/info.html',
    '/quran/messages.html',
    '/quran/miracles.html',
    '/tawheed/index.html',
    '/video/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// On install, cache the static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => {
                console.error('Failed to cache static assets:', err);
            })
    );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// On fetch, use a cache-first strategy
self.addEventListener('fetch', event => {
    // Let the browser handle requests for Supabase and prayer times API
    if (event.request.url.includes('supabase.co') || event.request.url.includes('aladhan.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // If the response is in the cache, return it
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If not in cache, fetch from network, cache it, and return it
                return fetch(event.request).then(
                    networkResponse => {
                        // Clone the response because it's a one-time-use stream
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    }
                );
            })
    );
});
