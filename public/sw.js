self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("budget-app-cache").then((cache) => {
      return cache.addAll([
        "/", 
        "/assets/logo.png",
        "/assets/icon-192.png",
        "/assets/icon-512.png",
        "/assets/screenshot-desktop.png",
        "/assets/screenshot-mobile.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
