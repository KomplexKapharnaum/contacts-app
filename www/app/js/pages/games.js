const GAMES = {}
GAMES.container = document.getElementById("games-container")

GAMES.initQuitButtons = function() {
    document.querySelectorAll('.game-leave').forEach(btn => {
        btn.addEventListener("click", ()=>{
            GAMES.goto("games")
            showNavbar(true)
        })
    })
}

GAMES.getButtons = function() {
    return Array.from(GAMES.container.querySelectorAll(".game-button"))
}

GAMES.showReturnButton = function(show) {
    document.querySelectorAll('.game-leave').forEach(btn => {
        btn.classList.toggle("show", show)
    })
}

GAMES.goto = function(pageId, fromMenu=false) {
    PAGES.goto(pageId)
    GAMES.showReturnButton(fromMenu)
    showNavbar(false)
}

GAMES.init = function() {
    const list = GAMES.getButtons()
    list.forEach(button => {
        button.addEventListener("click", ()=>GAMES.goto(button.dataset.gameId, true))
    });
}

GAMES.initQuitButtons()
GAMES.init()