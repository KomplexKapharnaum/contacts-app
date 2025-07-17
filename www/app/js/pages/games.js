const GAMES = {}

const customTribeColors = {
    1: "#FF0",
    2: "#F00",
    3: "#0F0"
}

GAMES.list = {
    kpad: ()=> document.WEBAPP_URL + "/kpad/",
    tribe_color: ()=> document.WEBAPP_URL + "/games/tribe_color/?color=" + encodeURIComponent(customTribeColors[parseInt(userData.tribe_id)]),
    images: ()=> document.WEBAPP_URL + "/games/image_picker/",
    videoloop: ()=> document.WEBAPP_URL + "/games/videoloop/?tribe=" + userData.tribe_id,
    garden: ()=> document.WEBAPP_URL + "/games/garden/",
    farm: ()=> document.WEBAPP_URL + "/games/farm/"
}

GAMES.container = document.getElementById("games-container")
GAMES.iframe = document.getElementById("game-iframe")


GAMES.initQuitButtons = function() {
    document.querySelectorAll('.game-leave').forEach(btn => {
        btn.addEventListener("click", ()=>{
            PAGES.goto("games")
            GAMES.stopGame();
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

GAMES.stopGame = function() {
    GAMES.iframe.src = ""
}

GAMES.loadGame = function(gameID) {
    let url = GAMES.list[gameID]()
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

const tribeNoiseGames = {
    1: "kpad",
    2: "farm",
    3: "garden"
}

GAMES.setTribeNoiseGame = () => {
    if (userData.tribe_id) {
        document.getElementById("tribe-noise-game").dataset.gameId = tribeNoiseGames[parseInt(userData.tribe_id)]
    }
}
// GAMES.setTribeNoiseGame
PAGES.addCallback("games", ()=>GAMES.setTribeNoiseGame())