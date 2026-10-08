// Abre al instante con la copia guardada y la actualiza en segundo plano.
// Si no hay copia (primera vez), la descarga de internet.
const CACHE = "mi-tienda-venta-v2";
const ASSETS = ["./", "./config.js", "./app.enc", "./manifest.json", "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png"];

async function limpia(res) {
  if (!res || !res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(ASSETS.map((url) => fetch(url, { cache: "no-cache" }).then(limpia).then((res) => res.ok && cache.put(url, res)).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Todas las páginas de la app comparten la misma copia ("./"), sin importar el #código.
  const clave = req.mode === "navigate" ? "./" : req;
  const deRed = fetch(req, { cache: "no-cache" })
    .then(limpia)
    .then((res) => {
      if (res.ok) {
        const copia = res.clone();
        caches.open(CACHE).then((cache) => cache.put(clave, copia));
      }
      return res;
    });
  event.waitUntil(deRed.catch(() => {}));
  event.respondWith(
    caches.match(clave, { ignoreSearch: true }).then((guardada) => guardada || deRed)
  );
});
