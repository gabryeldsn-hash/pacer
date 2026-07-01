// Service worker do Pacer.
// Objetivo: tornar o app instalável e abrir rápido (casca em cache).
// IMPORTANTE: as chamadas de API (/api/...) NUNCA são cacheadas — sempre vão à rede,
// senão o relevo e a estratégia ficariam congelados.
const CACHE = 'pacer-v37';
const SHELL = ['/', '/index.html', '/app.html', '/manifest.webmanifest', '/icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Nunca cachear o backend nem o Google (mapa/elevação/IA precisam ser ao vivo).
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return; // deixa o navegador buscar normalmente na rede
  }

  // Para o resto (HTML/CSS/ícones): tenta o cache, cai para a rede.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
