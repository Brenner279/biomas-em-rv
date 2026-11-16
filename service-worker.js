/* Brasil Imersivo: PWA com cache offline para panoramas, imagens e vídeos 360°. */
const APP_PREFIX = "brasil-imersivo";
const SHELL_CACHE = APP_PREFIX + "-shell-v1";
const OFFLINE_CACHE = APP_PREFIX + "-media-v1";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./assets/offline-icon.svg",
  "./vendor/aframe.min.js",
  "./vendor/webxr-polyfill.min.js"
];

const OFFLINE_FILES = [
  "assets/mapa.png",
  "amaz.png",
  "Caatinga.png",
  "Cer.png",
  "Mata.png",
  "Pantanal.png",
  "Pampa.png",

  "assets/biomas/amazonia/fauna-flora.jpg",
  "assets/biomas/amazonia/hidrografia.jpg",
  "assets/biomas/amazonia/clima.jpg",
  "assets/biomas/amazonia/vegetacao.jpg",
  "assets/biomas/amazonia/fauna-vr.mp4",

  "assets/biomas/cerrado/fauna-flora.jpg",
  "assets/biomas/cerrado/hidrografia.jpg",
  "assets/biomas/cerrado/clima.jpg",
  "assets/biomas/cerrado/vegetacao.jpg",
  "assets/biomas/cerrado/fauna-vr.mp4",

  "assets/biomas/caatinga/fauna-flora.jpg",
  "assets/biomas/caatinga/hidrografia.jpg",
  "assets/biomas/caatinga/clima.jpg",
  "assets/biomas/caatinga/vegetacao.jpg",
  "assets/biomas/caatinga/fauna-vr.mp4",

  "assets/biomas/mata-atlantica/fauna-flora.jpg",
  "assets/biomas/mata-atlantica/hidrografia.jpg",
  "assets/biomas/mata-atlantica/clima.jpg",
  "assets/biomas/mata-atlantica/vegetacao.jpg",
  "assets/biomas/mata-atlantica/fauna-vr.mp4",

  "assets/biomas/pantanal/fauna-flora.jpg",
  "assets/biomas/pantanal/hidrografia.jpg",
  "assets/biomas/pantanal/clima.jpg",
  "assets/biomas/pantanal/vegetacao.jpg",
  "assets/biomas/pantanal/fauna-vr.mp4",

  "assets/biomas/pampa/fauna-flora.jpg",
  "assets/biomas/pampa/hidrografia.jpg",
  "assets/biomas/pampa/clima.jpg",
  "assets/biomas/pampa/vegetacao.jpg",
  "assets/biomas/pampa/fauna-vr.mp4"
];

function absoluteUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function cacheAllShellFiles() {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(SHELL_FILES.map(absoluteUrl));
}

self.addEventListener("install", event => {
  event.waitUntil(
    cacheAllShellFiles().then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, OFFLINE_CACHE]);
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(APP_PREFIX + "-") && !keep.has(name))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function sendProgress(port, data) {
  if (port) port.postMessage(data);
}

async function prepareOffline(port) {
  const cache = await caches.open(OFFLINE_CACHE);
  let completed = 0;

  for (const file of OFFLINE_FILES) {
    const url = absoluteUrl(file);
    try {
      const existing = await cache.match(url);
      if (!existing) {
        const response = await fetch(url, { cache: "reload" });
        if (!response.ok || response.status !== 200) {
          throw new Error("HTTP " + response.status);
        }
        await cache.put(url, response.clone());
      }
      completed += 1;
      await sendProgress(port, {
        type: "progress",
        completed,
        total: OFFLINE_FILES.length,
        file
      });
    } catch (error) {
      await sendProgress(port, {
        type: "error",
        message: "Não foi possível baixar " + file + ". " + (error.message || "")
      });
      return;
    }
  }

  await sendProgress(port, {
    type: "done",
    completed,
    total: OFFLINE_FILES.length
  });
}

self.addEventListener("message", event => {
  if (!event.data || event.data.type !== "PREPARE_OFFLINE") return;
  const port = event.ports && event.ports[0];
  event.waitUntil(prepareOffline(port));
});

function buildRangeResponse(cachedResponse, rangeHeader) {
  return cachedResponse.blob().then(blob => {
    const size = blob.size;
    const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader || "");
    if (!match || size === 0) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": "bytes */" + size }
      });
    }

    let start;
    let end;
    if (match[1] === "") {
      const suffixLength = Number(match[2]);
      start = Math.max(0, size - suffixLength);
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
    }

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        start < 0 || start >= size || end < start) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": "bytes */" + size }
      });
    }

    const headers = new Headers(cachedResponse.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Range", "bytes " + start + "-" + end + "/" + size);
    headers.set("Content-Length", String(end - start + 1));
    headers.delete("Content-Encoding");
    headers.delete("Transfer-Encoding");

    return new Response(blob.slice(start, end + 1), {
      status: 206,
      statusText: "Partial Content",
      headers
    });
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  event.respondWith((async () => {
    const keyUrl = new URL(request.url);
    keyUrl.search = "";
    keyUrl.hash = "";

    // O Chrome usa Range para iniciar e avançar vídeos MP4.
    // Depois do download offline, entregamos respostas 206 do arquivo em cache.
    const range = request.headers.get("range");
    if (range) {
      const cachedMedia = await caches.match(new Request(keyUrl.href));
      if (cachedMedia) return buildRangeResponse(cachedMedia, range);
      return fetch(request);
    }

    // Para navegação, tenta obter a versão mais recente e usa o index em cache sem rede.
    if (request.mode === "navigate") {
      const cachedIndex = await caches.match(absoluteUrl("./index.html"));
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put(absoluteUrl("./index.html"), networkResponse.clone());
        }
        return networkResponse;
      } catch (_) {
        return cachedIndex || new Response(
          "A versão offline ainda não foi preparada neste navegador.",
          { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      }
    }

    const cached = await caches.match(new Request(keyUrl.href));
    if (cached) return cached;

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(OFFLINE_CACHE);
        await cache.put(keyUrl.href, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response(
        "Este arquivo ainda não foi baixado para o uso offline.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
  })());
});
