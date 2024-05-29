const test = new roundedGraphics(document.getElementById("background"), 5);

test.addElement(document.querySelector(".illustration"));
// document.querySelectorAll("button").forEach(button => test.addElement(button));
test.updateColor(getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
test.render();

let UTIL = {};

UTIL.alert = function(message) {
    alert(message);
};

UTIL.registerServiceWorker = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./js/sw.js')
        .then(function(reg) {
            console.log('Service Worker registered with scope: ', reg.scope);
        })
        .catch(function(err) {
            console.log('Service Worker registration failed: ', err);
        });
    }
};

UTIL.registerServiceWorker();

UTIL.isPWACompatible = function() {
    return ('serviceWorker' in navigator);
}

UTIL.promptPWAInstall = function() {
    if (UTIL.isPWACompatible()) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.prompt();
        });
    }
}

let PAGES = {
    class: "page"
};

PAGES.all = function() {
    return document.getElementsByClassName(PAGES.class);
};

PAGES.active = function() {
    let pages = PAGES.all();
    for (let i = 0; i < pages.length; i++) {
        if (pages[i].classList.contains("active")) {
            return pages[i];
        }
    }
}

PAGES.callbacks = {};

PAGES.addCallback = function(pageID, callback) {
    PAGES.callbacks[pageID] = callback;
}

PAGES.callback = function(page) {
    if (PAGES.callbacks[page]) PAGES.callbacks[page]();
}

PAGES.goto = function(pageID) {
    const page = document.querySelector(`.page[data-page-id="${pageID}"]`);
    if (!page) UTIL.alert(`Page with ID "${pageID}" not found`);

    PAGES.active().classList.remove("active");
    page.classList.add("active");

    PAGES.callback(pageID);
}

PAGES.random = function(...routes) {
    let index = Math.floor(Math.random() * routes.length);
    PAGES.goto(routes[index]);
}
    
PAGES.home = function() { PAGES.goto("home"); };

/* Initialize the application */

document.addEventListener("DOMContentLoaded", function() {
    if (!UTIL.isPWACompatible()) {
        PAGES.goto("unsupported");
        return;
    }
});