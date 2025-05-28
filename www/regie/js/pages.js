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
    setActiveButton(document.querySelector(".goto-page[data-page-id='" + pageID + "']"));
    PAGES.callback(pageID);

    // TODO: less HACKY 
    // hide div id  "select-group" if pageID is preset
    if (pageID == "preset") {
        document.getElementById("select-group").style.display = "none";
        document.getElementById("presets-title").style.display = "block";
    }
    else {
        document.getElementById("select-group").style.display = "block";
        document.getElementById("presets-title").style.display = "none";
    }
}

const pages_btns = document.querySelectorAll(".goto-page");

function setActiveButton(btn) {
    pages_btns.forEach((btn) => {
        btn.classList.remove("selected");
    })
    btn.classList.add("selected");
}

pages_btns.forEach((btn) => {
    btn.addEventListener("click", () => {
        PAGES.goto(btn.dataset.pageId);
    })
})

PAGES.goto("preset", true)