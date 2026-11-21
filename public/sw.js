const CACHE_NAME = "pio-pio-menu-v3";
const STATIC_ASSETS = [
  "/logo-pio-pio.png",
  "/manifest.json",
  "/manifest-admin.json",
  "/manifest-menu.json",
  "/manifest-waiter.json",
  "/favicon.ico",
];

// Instalación: Cachear assets estáticos esenciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de caches antiguos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. REGLA ESTRICTA: NUNCA cachear llamadas a la API (/api/*) ni al panel administrativo (/admin/*)
  // Esto garantiza que platos agotados y cambios de precios se sincronicen en tiempo real sin desfase.
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/admin")) {
    return;
  }

  // 2. Navegación principal (HTML de la carta digital): NETWORK FIRST con fallback a caché
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match("/")))
    );
    return;
  }

  // 3. Assets estáticos (Logo, manifest, favicon): CACHE FIRST con actualización en red
  if (
    url.pathname === "/logo-pio-pio.png" ||
    url.pathname.startsWith("/manifest") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Por defecto, red directa
  event.respondWith(fetch(event.request));
});
