const CACHE_NAME = 'islamic-treasure-v5.10';

// فایلە سەرەکییەکان بۆ پاشەکەوتکردن (App Shell)
const ASSETS = [
    '/',
    '/index.html',
    '/css/style-min.css',
    '/js/script.js',
    '/js/theme.js',
    '/manifest.json',
    '/assets/icons/Icon192.png',
    '/assets/icons/Icon512.png',
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
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
];


// 1. Install Event: پاشەکەوتکردنی فایلە سەرەکییەکان
self.addEventListener('install', (event) => {
    // چالاککردنی خێرا (Skip Waiting) بۆ ئەوەی ڕاستەوخۆ کۆنتڕۆڵ بگرێتە دەست
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});


// 2. Activate Event: سڕینەوەی کاشی کۆن
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});


// 3. Fetch Event: ستراتیژی جیاواز بۆ فایلە ناوخۆیی و دەرەکییەکان
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // چارەسەری کێشەی Google Analytics لە کاتی ئۆفڵاین
    if (url.hostname.includes('googletagmanager.com') || url.hostname.includes('google-analytics.com')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response('', { status: 200, headers: { 'Content-Type': 'application/javascript' } });
            })
        );
        return;
    }

    // پشتگوێخستنی داواکارییەکانی جگە لە GET و داواکارییەکانی Supabase API
    if (request.method !== 'GET' || url.hostname.includes('supabase.co')) {
        return;
    }

    // ستراتیژی جیاواز بۆ فایلە ناوخۆییەکان
    if (url.origin === self.location.origin) {
        // 1. HTML Files: Network First (بۆ ئەوەی گۆڕانکارییەکان ڕاستەوخۆ دەرکەون)
        if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                        return response;
                    })
                    .catch(() => caches.match(request))
            );
            return;
        }

        // 2. CSS, JS, Images: Stale-While-Revalidate (بۆ خێرایی زۆر)
        // سەرەتا لە کاشەوە دەهێنرێت، دواتر لە پشتەوە نوێ دەکرێتەوە
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const networkFetch = fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                });

                return cachedResponse || networkFetch;
            })
        );
        return;
    }

    // ستراتیژی Cache First بۆ فایلە دەرەکییەکان (فۆنت، ئایکۆن، کتێبخانە)
    // ئەمە وا دەکات ئەگەر جارێک داونلۆد بوون، لە کاتی ئۆفڵاین لە کاشەوە بەکاربێنەوە
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
    );
});