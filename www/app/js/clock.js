var clock = {}

clock.items = {}

clock.add = function(pagename, f) {
    if (!clock.items[pagename]) clock.items[pagename] = []
    clock.items[pagename].push(f)
}

clock.clear = function(pagename) {
    if (clock.items[pagename]) clock.items[pagename] = []
}

clock.start = function() {
    setInterval(() => {
        const active = PAGES.active().dataset.pageId
        if (clock.items[active]) clock.items[active].forEach(f => f())
    }, 1000)
}

clock.start()