const CACHE_NAME = "controle-financeiro-v1";

const arquivos = [
    "./",
    "./index.html",
    "./manifest.json",
  
    "./styles.css",
    "./script.js",
  
    "./css/estilo.css",
    "./js/app.js",
  
    "./icons/icon-192.png",
    "./icons/icon-512.png"
  ];

self.addEventListener("install", function(event){

    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache){
            return cache.addAll(arquivos);
        })
    );

});


self.addEventListener("fetch", function(event){

    event.respondWith(
        caches.match(event.request)
        .then(function(response){

            return response || fetch(event.request);

        })
    );

});