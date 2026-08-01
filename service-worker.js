const CACHE_NAME = "controle-financeiro-v2";

const arquivos = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/estilo.css",
    "./js/app.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


// Instala o novo Service Worker

self.addEventListener("install", function(event){

    self.skipWaiting();

    event.waitUntil(

        caches.open(CACHE_NAME)
        .then(function(cache){

            return cache.addAll(arquivos);

        })

    );

});


// Remove caches antigos

self.addEventListener("activate", function(event){

    event.waitUntil(

        caches.keys()
        .then(function(keys){

            return Promise.all(

                keys.map(function(key){

                    if(key !== CACHE_NAME){

                        return caches.delete(key);

                    }

                })

            );

        })

    );

    self.clients.claim();

});


// Busca atualização primeiro

self.addEventListener("fetch", function(event){

    event.respondWith(

        fetch(event.request)

        .then(function(response){

            return response;

        })

        .catch(function(){

            return caches.match(event.request);

        })

    );

});