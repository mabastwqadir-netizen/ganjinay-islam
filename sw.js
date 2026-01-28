const CACHE_NAME = 'islamic-treasure-v4';

// فایلە سەرەکییەکان بۆ پاشەکەوتکردن (App Shell)
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    '/manifest.json',
    '/assets/logo.png',
    // زیادکردنی فایلە دەرەکییە سەرەکییەکان بۆ ئەوەی ئۆفڵاین کاربکەن
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

    // ستراتیژی Network First بۆ فایلە ناوخۆییەکان (بۆ وەرگرتنی نوێترین وەشان)
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request))
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