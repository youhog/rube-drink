const CACHE_NAME = 'drink-tracker-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './favicon.svg',
    'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

// 安裝 Service Worker 並快取靜態檔案
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// 攔截網路請求：網路優先 (Network First)
self.addEventListener('fetch', (event) => {
    // 忽略 Firebase 或其他 API 請求 (讓它們保持即時連線)
    if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 如果抓取成功，順便更新快取
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // 網路斷線時，才使用快取
                return caches.match(event.request);
            })
    );
});

// 更新版本時清除舊快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
