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
    return null;
};

PAGES.callbacks = {};
PAGES.addCallback = function(pageID, callback) {
    PAGES.callbacks[pageID] = callback;
};

PAGES.callback = function(page) {
    if (PAGES.callbacks[page]) PAGES.callbacks[page]();
};

PAGES.goto = function(pageID, init=false, fromHistory=false) {
    const page = document.querySelector(`.page[data-page-id="${pageID}"]`);
    if (!page) {
        alert(`Page with ID "${pageID}" not found`);
        return;
    }

    const currentPage = PAGES.active();
    
    // Remove active class from current page
    if (currentPage && !init) {
        currentPage.classList.remove("active");
    }

    // Add active class to target page
    page.classList.add("active");
   
    // Set buddy dialogue
    BUD.setCurrentDialogue(PAGES.buddyDials[pageID]);

    // Run page-specific callback
    PAGES.callback(pageID);

    // Update background color if specified
    if (page.dataset.pageColor) {
        document.documentElement.style.setProperty('--bg-color', page.dataset.pageColor);
    }

    // Handle history states
    if (!fromHistory) {
        const historyState = PAGES.historyStates[pageID];
        if (historyState === "push") {
            // Push new state to history
            history.pushState({ pageId: pageID }, '', `#${pageID}`);
        } else if (historyState === "purge") {
            // Replace current state
            history.replaceState({ pageId: pageID }, '', `#${pageID}`);
        }
    }
};

PAGES.setPageColor = function(pageID, color) {
    const page = document.querySelector(`.page[data-page-id="${pageID}"]`);
    if (page) page.dataset.pageColor = color;
};

PAGES.buddyDials = {};
PAGES.setBuddyDial = function(id, dial) {
    PAGES.buddyDials[id] = dial;
};

PAGES.historyStates = {};
PAGES.setHistoryState = function(pages, state) {
    pages.forEach(pageID => {
        PAGES.historyStates[pageID] = state;
    });
};

// Enhanced popstate handler
window.onpopstate = (event) => {
    // Check if there's a valid state
    if (event.state && event.state.pageId) {
        // Navigate to the page from history
        PAGES.goto(event.state.pageId, false, true);
    } else {
        // Fallback to hash
        const hash = window.location.hash.substring(1);
        if (hash) {
            PAGES.goto(hash, false, true);
        }
    }
};

// Handle initial page load
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        PAGES.goto(hash, true);
    }
});