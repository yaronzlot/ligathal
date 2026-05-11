const CACHE_NAME = 'winner-sal-v2';
const STATIC_ASSETS = [
  '/ligathal/',
  '/ligathal/index.html',
  '/ligathal/manifest.json',
  '/ligathal/sw.js'
];

// התקנה — שמירת קבצים בסיסיים ב-cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// הפעלה — מחיקת cache ישן
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network First (תמיד מנסה רשת קודם, fallback ל-cache)
self.addEventListener('fetch', event => {
  // דלג על בקשות Firebase ו-API
  const url = event.request.url;
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('thesportsdb.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('gstatic.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // שמור עותק ב-cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // אם אין רשת — החזר מ-cache
        return caches.match(event.request).then(r => r || caches.match('/ligathal/index.html'));
      })
  );
});
