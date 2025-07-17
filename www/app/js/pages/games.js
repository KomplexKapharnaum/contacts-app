const GAMES = {}

const customTribeColors = {
    1: "#FF0",
    2: "#F00",
    3: "#0F0"
}

GAMES.list = {
    vocolor:   ()=> ({ type: "page", value: "game-vocolor" }),
    kpad:      ()=> ({ type: "iframe", value: document.WEBAPP_URL + "/games/kpad/" }),
    images:    ()=> ({ type: "iframe", value: document.WEBAPP_URL + "/games/image_picker/" }),
    videoloop: ()=> ({ type: "iframe", value: document.WEBAPP_URL + "/games/videoloop/?tribe=" + userData.tribe_id }),
    garden:    ()=> ({ type: "iframe", value: document.WEBAPP_URL + "/games/garden/" }),
    farm:      ()=> ({ type: "iframe", value: document.WEBAPP_URL + "/games/farm/" })
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
    const entry = GAMES.list[gameID]();
    if (!entry) return;

    if (entry.type === "iframe") {
        GAMES.iframe.src = entry.value;
        PAGES.goto("game-iframe")
    } else if (entry.type === "page") {
        GAMES.iframe.src = "";
        PAGES.goto(entry.value);
    }
};

GAMES.goto = function(gameID, fromMenu=false) {
    GAMES.loadGame(gameID)
    GAMES.showReturnButton(fromMenu)
    showNavbar(false)
}

GAMES.init = function() {
    const list = GAMES.getButtons()
    list.forEach(button => {
        button.addEventListener("click", () => GAMES.goto(button.dataset.gameId, true))
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