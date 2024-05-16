const ressourcesToCache = [
    "", // root (app.html)
    "style.css"
]

const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache("/pwa/" + ressourcesToCache),
    );
});

const cacheFirst = async (request) => {
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
        return responseFromCache;
    }
    return fetch(request);
};

self.addEventListener("fetch", (event) => {
    event.respondWith(cacheFirst(event.request));
});

self.addEventListener("push", (event) => {
    const payload = event.data?.text() ?? "no payload";
    event.waitUntil(
        self.registration.showNotification("Notification received !", {
            body: payload,
        }),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close(); 
});