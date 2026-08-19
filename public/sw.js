self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through to satisfy PWA requirements
  e.respondWith(fetch(e.request).catch(() => new Response("Offline")));
});
