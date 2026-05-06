const CACHE_NAME = 'taxpro-gst-v1';
const urlsToCache = [
  '/',
  '/static/js/main.chunk.js',
  '/static/css/main.chunk.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});