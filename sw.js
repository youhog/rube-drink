const CACHE_NAME = 'drink-tracker-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './favicon.svg'
];

// 安裝 Service Worker 並快取靜態檔案
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// 攔截網路請求：優先使用快取，沒快取才上網抓
self.addEventListener('fetch', (event) => {
    // 忽略 Firebase 或其他 API 請求 (讓它們保持即時連線)
    if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
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
