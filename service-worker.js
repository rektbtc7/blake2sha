```javascript
const CACHE_NAME = "blake-to-sha-v1";

const APP_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.png"
];

self.addEventListener(
  "install",
  (event) => {

    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(
          (cache) => {
            return cache.addAll(APP_FILES);
          }
        )
        .then(
          () => {
            return self.skipWaiting();
          }
        )
    );
  }
);

self.addEventListener(
  "activate",
  (event) => {

    event.waitUntil(
      caches.keys()
        .then(
          (cacheNames) => {

            return Promise.all(
              cacheNames
                .filter(
                  (cacheName) => {
                    return cacheName !== CACHE_NAME;
                  }
                )
                .map(
                  (cacheName) => {
                    return caches.delete(cacheName);
                  }
                )
            );
          }
        )
        .then(
          () => {
            return self.clients.claim();
          }
        )
    );
  }
);

self.addEventListener(
  "fetch",
  (event) => {

    if (
      event.request.method !== "GET"
    ) {
      return;
    }

    const requestUrl =
      new URL(event.request.url);

    if (
      requestUrl.origin !==
      self.location.origin
    ) {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then(
          (response) => {

            if (
              response &&
              response.status === 200
            ) {

              const responseClone =
                response.clone();

              caches.open(CACHE_NAME)
                .then(
                  (cache) => {
                    cache.put(
                      event.request,
                      responseClone
                    );
                  }
                );
            }

            return response;
          }
        )
        .catch(
          () => {
            return caches.match(
              event.request
            );
          }
        )
    );
  }
);
```
