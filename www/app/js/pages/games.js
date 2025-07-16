const GAMES = {}

GAMES.list = {
    kpad: "https://contacts.kxkm.net/kpad/"
}

GAMES.container = document.getElementById("games-container")
GAMES.iframe = document.getElementById("game-iframe")


GAMES.initQuitButtons = function() {
    document.querySelectorAll('.game-leave').forEach(btn => {
        btn.addEventListener("click", ()=>{
            PAGES.goto("games")
            GAMES.iframe.src = ""
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

GAMES.loadGame = function(gameID) {
    const url = GAMES.list[gameID]
    GAMES.iframe.src = url
}

GAMES.goto = function(gameID, fromMenu=false) {
    GAMES.loadGame(gameID)
    PAGES.goto("game-iframe")
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