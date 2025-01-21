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

PAGES.goto = function(pageID, init=false) {
    const page = document.querySelector(`.page[data-page-id="${pageID}"]`);
    if (!page) alert(`Page with ID "${pageID}" not found`);

    if (!init) PAGES.active().classList.remove("active");
    page.classList.add("active");
    PAGES.callback(pageID);
}