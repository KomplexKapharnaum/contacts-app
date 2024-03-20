/* ========== Utility functions ==========*/

let UTIL = {};

UTIL.alert = function(message) {
    alert(message);
};

/*========== Page-related functions ==========*/

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

/*========== Prompt-related functions ==========*/

let USER = {
    name: "",
    selfie: "",
    prompts: []
};

USER.setName = function(name) {
    USER.name = name;
}

USER.setSelfie = function(selfie) {
    USER.selfie = selfie;
}

USER.addPrompt = function(name, value) {
    USER.prompts = USER.prompts.filter(prompt => prompt.name !== name);
    USER.prompts.push({
        name: name,
        value: value
    });
}

document.addEventListener("click", function(event) {
    const html = document.querySelector("html");
    if (html.requestFullscreen) {
        html.requestFullscreen();
    } else if (html.mozRequestFullScreen) { // Firefox
        html.mozRequestFullScreen();
    } else if (html.webkitRequestFullscreen) { // Chrome, Safari and Opera
        html.webkitRequestFullscreen();
    } else if (html.msRequestFullscreen) { // IE/Edge
        html.msRequestFullscreen();
    }
});
