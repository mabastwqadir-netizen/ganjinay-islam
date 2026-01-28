const CACHE_NAME = 'islamic-treasure-v3';

// فایلە سەرەکییەکان بۆ پاشەکەوتکردن (App Shell)
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    '/manifest.json',
    '/assets/logo.png'
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

// 3. Fetch Event: ستراتیژی Network First (سەرەتا ئینتەرنێت، ئەگەر نەبوو کاش)
self.addEventListener('fetch', (event) => {
    // چارەسەری کێشەی Google Analytics لە کاتی ئۆفڵاین
    // ئەگەر ئینتەرنێت نەبوو، وەڵامێکی بەتاڵ دەگەڕێنێتەوە بۆ ئەوەی ماڵپەڕەکە نەوەستێت
    if (event.request.url.includes('googletagmanager.com') || event.request.url.includes('google-analytics.com')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response('', { status: 200, headers: { 'Content-Type': 'application/javascript' } });
            })
        );
        return;
    }

    // تەنها بۆ داواکارییەکانی ناو ماڵپەڕ (Supabase و دەرەکییەکان پشتگوێ دەخرێن تا script.js کاری خۆی بکات)
    if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // ئەگەر وەڵامەکە دروست بوو، نوێی بکەرەوە لە کاشدا
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // ئەگەر ئینتەرنێت نەبوو، لە کاشەوە بیهێنە
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    // ئەگەر پەڕەی HTML بوو و لە کاش نەبوو، دەکرێت پەڕەی سەرەکی پیشان بدەین
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});