const CACHE_NAME = "controle-financeiro-v9";

const arquivos = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/estilo.css?v=9",
    "./css/inicio.css?v=9",
    "./js/app.js?v=9",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", function(event) {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(arquivos);
        })
    );
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.map(function(key) {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", function(event) {
    event.respondWith(
        fetch(event.request, { cache: "no-store" }).then(function(response) {
            return response;
        }).catch(function() {
            return caches.match(event.request, { ignoreSearch: true });
        })
    );
});