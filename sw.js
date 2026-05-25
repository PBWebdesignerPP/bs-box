const CACHE_NAME = "bsbox-v3";

/* arquivos essenciais do app */

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo_conecta.png",
  "./base_de_produtos.xlsx"
];

/* instalação */

self.addEventListener("install", event => {

  self.skipWaiting();

  event.waitUntil(

    caches.open(CACHE_NAME)
    .then(cache => {

      return cache.addAll(APP_FILES);

    })
  );
});

/* ativação */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))

      );
    })
  );

  self.clients.claim();
});

/* fetch inteligente */

self.addEventListener("fetch", event => {

  /* somente GET */

  if(event.request.method !== "GET") return;

  event.respondWith(

    caches.match(event.request)

    .then(cachedResponse => {

      /* retorna cache se existir */

      if(cachedResponse){

        return cachedResponse;
      }

      /* senão busca na internet */

      return fetch(event.request)

      .then(networkResponse => {

        /* ignora requests inválidos */

        if(
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ){
          return networkResponse;
        }

        /* salva apenas arquivos locais */

        const url = new URL(event.request.url);

        if(url.origin === location.origin){

          const responseClone =
          networkResponse.clone();

          caches.open(CACHE_NAME)
          .then(cache => {

            cache.put(
              event.request,
              responseClone
            );

          });
        }

        return networkResponse;

      });
    })

    .catch(() => {

      /* fallback simples */

      return caches.match("./index.html");

    })
  );
});
