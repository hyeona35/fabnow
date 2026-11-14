// fabnow PWA Service Worker (Offline App Shell, Hashed Asset Cache & Live Feed Fallback)
const CACHE_VERSION = "v2";
const SHELL_CACHE = `fabnow-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `fabnow-static-${CACHE_VERSION}`;
const DATA_CACHE = `fabnow-data-${CACHE_VERSION}`;
const ACTIVE_CACHES = new Set([SHELL_CACHE, STATIC_CACHE, DATA_CACHE]);

const CRITICAL_SHELL_ASSETS = [
  "/offline.html",
  "/icon.svg",
  "/manifest.webmanifest",
];

const OPTIONAL_PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/fonts/NanumSquareNeoTTF-bRg.woff2",
  "/fonts/NanumSquareNeoTTF-cBd.woff2",
  "/fonts/NanumSquareNeoTTF-dEb.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.allSettled(
        CRITICAL_SHELL_ASSETS.map((asset) => cache.add(asset))
      );
      await Promise.allSettled(
        OPTIONAL_PRECACHE_ASSETS.map((asset) => cache.add(asset))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!ACTIVE_CACHES.has(key)) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isHashedStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/fonts/")
  );
}

function isLiveTelemetryPath(pathname) {
  return (
    pathname === "/api/fabnow" ||
    pathname === "/feed.xml" ||
    pathname === "/rss.xml"
  );
}

function isMediaOrManifestAsset(pathname) {
  return (
    pathname === "/icon.svg" ||
    pathname === "/icon-192.png" ||
    pathname === "/icon-512.png" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/favicon.ico" ||
    pathname === "/og-image.png" ||
    pathname === "/screenshot_desktop.png" ||
    pathname === "/screenshot_mobile.png" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json"
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && response.type === "basic") {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await networkPromise) || Response.error();
}

async function networkFirstData(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({
        error: "offline",
        message: "오프라인 상태이며 캐시된 피드가 아직 없습니다.",
      }),
      {
        status: 503,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok && !response.redirected && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cachedRoute = await caches.match(request);
    if (cachedRoute) return cachedRoute;
    const cachedHome = await caches.match("/");
    if (cachedHome) return cachedHome;
    const offlineFallback = await caches.match("/offline.html");
    if (offlineFallback) return offlineFallback;
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isHashedStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isLiveTelemetryPath(url.pathname)) {
    event.respondWith(networkFirstData(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isMediaOrManifestAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});
