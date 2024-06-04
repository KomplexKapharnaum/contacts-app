const baseRessourcePath = "/app";

const ressourcesToCache = [
    "/", // root (app.html)
    "/css/main.css"
]

const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    for (let resource of resources) {
        // console.log("Caching " + baseRessourcePath + resource);
        await cache.add(baseRessourcePath + resource);
    }
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache(ressourcesToCache),
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