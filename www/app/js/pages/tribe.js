const tribe_top10 = document.getElementById("top10-container")

async function loadLeaderBoard() {
    if (!userData) return
    const tribeID = userData.tribe_id

    if (!tribeID) return

    const data = await QUERY.getLeaderBoard();

    if (!data) return
    if (!data.status) return
    const header = document.getElementById("tribe-rank")
    const header_suffix = document.getElementById("tribe-rank-suffix")
    const score = document.getElementById("tribe-score")

    const tribe_rank = Object.values(data.data).sort((a, b) => b.general - a.general).findIndex(obj => obj.id === tribeID) + 1

    header.innerText = tribe_rank + 1
    header_suffix.innerText = tribe_rank>0 ? "eme" : "er"
    score.innerText = data.data[tribeID].global

    const leaderboard_players = data.data[tribeID].players
    
    if (leaderboard_players)
        for (let i=0;  i<10 ; i++) {
            if (i >= leaderboard_players.length) break
            const ply = leaderboard_players[i]
            if (ply) {
                if (i<3) {
                    const elms = document.querySelectorAll(".podium-item.pod-"+ (i+1))
                    elms.forEach(elm => {
                        elm.querySelector(".score").innerText = ply.score + " "
                        elm.querySelector(".username").innerText = ply.name
                        if (ply.avatar) elm.querySelector("img").src = document.WEBAPP_URL + "/avatars/" + ply.avatar
                    })
                } else {
                    const tem = document.getElementById("tem-leaderboard-top10").cloneNode(true).content
                    tem.querySelector(".rank").innerText = i+1
                    tem.querySelector(".username").innerText = ply.name
                    tem.querySelector(".score span").innerText = ply.score
                    if (ply.avatar) tem.querySelector("img").src = document.WEBAPP_URL + "/avatars/" + ply.avatar
                    tribe_top10.appendChild(tem)
                }
            }
        }
}

/* Tribe questions */

let obform_data = {};

const obform_life_fingerprint = document.getElementById("btn-onboarding-question-fingerprint")
const obform_life_state = document.querySelector("#onboarding-question-fingerprint-status > div")
const obform_life_send = document.getElementById("onboarding-questions-fingerprint-send")

let obform_life_percent = 0

obform_life_fingerprint.addEventListener("touchstart", () => {
    obform_life_fingerprint.classList.add("active")
    obform_life_percent = 0;
    obform_life_state.style.width = obform_life_percent + "%";

    obform_life_send.classList.remove("disabled")

    const interval = setInterval(() => {
        // console.log("obform_life_percent", obform_life_percent)
        obform_life_percent += 1;
        obform_life_percent = Math.min(obform_life_percent, 100);
        obform_life_state.style.width = obform_life_percent + "%";

        if (obform_life_percent >= 100) {
            clearInterval(interval);
        }
    }, 50);

    const stopProgress = () => {
        obform_life_fingerprint.classList.remove("active")
        clearInterval(interval);
        obform_life_fingerprint.removeEventListener("touchend", stopProgress);
        obform_life_fingerprint.removeEventListener("touchcancel", stopProgress);
    };

    obform_life_fingerprint.addEventListener("touchend", stopProgress);
    obform_life_fingerprint.addEventListener("touchcancel", stopProgress);
})

obform_life_send.addEventListener("click", () => {
    obform_data.fingerprint = obform_life_percent
    PAGES.goto("onboarding-questions-violence")
})

const obform_violence_btn = document.getElementById("btn-onboarding-question-violence-spam")
const obform_violence_send = document.getElementById("onboarding-questions-violence-send")
const obform_violence_restart = document.getElementById("btn-onboarding-question-violence-restart")
const obform_violence_text = document.getElementById("onboarding-question-violence-text")
const obform_violence_text_initial = obform_violence_text.innerText

let obform_violence_state = 0;
let obform_violence_clicks = 0;
let obform_violence_timer;

obform_violence_restart.addEventListener("click", () => {
    obform_violence_state = 0;
    obform_violence_clicks = 0;
    obform_violence_send.classList.add("disabled")
    obform_violence_btn.classList.remove("disabled")
    obform_violence_restart.classList.remove("active")
    obform_violence_btn.removeEventListener("click", incrementClicks);
    obform_violence_text.innerText = obform_violence_text_initial
})

obform_violence_btn.addEventListener("click", () => {
    if (obform_violence_state === 0) {    
        obform_violence_state = 1;
        obform_violence_clicks = 0;

        clearTimeout(obform_violence_timer);
        
        let t=10;
        obform_violence_text.innerText = "00:00:10";
        const timerInterval = setInterval(() => {
            t--;
            obform_violence_text.innerText = "00:00:" + (t < 10 ? "0" + t : t);
        }, 1000)

        obform_violence_timer = setTimeout(() => {
            const clicksPerSecond = obform_violence_clicks / 10;
            // obform_violence_btn.innerText = `${clicksPerSecond} clicks par seconde !`;
            obform_violence_state = 2;
            obform_violence_btn.removeEventListener("click", incrementClicks);
            obform_violence_send.classList.remove("disabled")
            obform_violence_btn.classList.add("disabled")
            obform_violence_restart.classList.add("active")
            clearInterval(timerInterval);
            obform_violence_text.innerText = `${clicksPerSecond} clicks par seconde !`;
        }, 10000);

        obform_violence_btn.addEventListener("click", incrementClicks);
    }
});

const incrementClicks = () => {
    if (obform_violence_state === 1) {
        obform_violence_clicks++;
        obform_violence_btn.classList.add("active")
        setTimeout(() => {
            obform_violence_btn.classList.remove("active")
        }, 50);
        // obform_violence_btn.innerText = obform_violence_clicks
    }
};

obform_violence_send.addEventListener("click", () => {
    obform_data.violence = obform_violence_clicks
    PAGES.goto("onboarding-questions-dish")
})

// obform_violence_btn.addEventListener("touchend", () => {
//     obform_violence_btn.removeEventListener("touchend", incrementClicks);
// });

const obform_dishes_container = document.getElementById("dishes")
// const obform_dishes_send = document.getElementById("onboarding-questions-dish-send")

function obform_adddish(src, value) {
    const img = document.createElement("img")
    img.src = src
    img.alt = value
    img.classList.add("obform-dish")
    obform_dishes_container.appendChild(img)

    img.addEventListener("click", () => {
        obform_data.dish = value
        obform_process()
    })
}

obform_adddish(document.BASEPATH + "/img/food/steak.png", "animal")
obform_adddish(document.BASEPATH + "/img/food/mushroom.png", "vegetable")
obform_adddish(document.BASEPATH + "/img/food/battery.png", "machine")

async function obform_process() {
    let rank = {
        animal: 0,
        vegetable: 0,
        machine: 0
    }

    // Fingerprint
    if (obform_data.fingerprint >= 100) {
        rank.animal++
    } else if (obform_data.fingerprint >= 50) {
        rank.vegetable++
    } else {
        rank.machine++
    }

    // Violence
    if (obform_data.violence >= 55) {
        rank.animal++
    } else if (obform_data.violence >= 30) {
        rank.machine++
    } else {
        rank.vegetable++
    }

    // Dish
    switch (obform_data.dish) {
        case "animal":
            rank.animal++
            break;
        case "vegetable":
            rank.vegetable++
            break;
        case "machine":
            rank.machine++
            break;
    }

    let highestRank = null
    let highestCount = 0
    for (let r in rank) {
        if (rank[r] > highestCount) {
            highestRank = r
            highestCount = rank[r]
        }
    }

    let chosenTribeID = null
    switch (highestRank) {
        case "machine":
            chosenTribeID = 1
            break;
        case "animal":
            chosenTribeID = 2
            break;
        case "vegetable":
            chosenTribeID = 3
            break;
    }

    if (chosenTribeID) {
        const updateUser = await QUERY.setTribe(chosenTribeID)
        const tribes = await QUERY.getTribes()

        console.log("USER UPDATED TRIBE", updateUser)

        if (!updateUser.status || !tribes.status) {
            alert("Une erreur s'est produite, veuillez recharger la page.");
            return
        };
        
        userData.tribe_id = updateUser.data.tribe_id
        DATA_TRIBES = tribes.data
        document.getElementById("tribe-name").innerText = tribes.data[userData.tribe_id-1].name

        const tribeName = DATA_TRIBES[parseInt(updateUser.data.tribe_id)-1].name

        if (document.APPSTATE) {
            cordova.plugins.firebase.messaging.subscribe("tribe-"+tribeName)
            .then(function () {
                console.log("Successfully subscribed to the topic!");
            })
            .catch(function (error) {
                console.error("Error subscribing to the topic:", error);
            });
        }

        feature_show("tribe")
        PAGES.goto("tribe")

        BUD.setCurrentDialogue(BUD_DIALS.tribe, true)
        showNavbar(true)
        loadLeaderBoard()
    }
}

/* Tribe cry recorder */

const recorder = new Recorder()
const cry_btns_container = document.getElementById("tribe-cry-buttons")
const cryBtns = {
    record: document.getElementById("btn-cry-record"),
    timer: document.getElementById("btn-cry-timer"),
    play: document.getElementById("btn-cry-play"),
    restart: document.getElementById("btn-cry-restart")
}

function showCryBtns(name) {
    cry_btns_container.querySelectorAll("div[data-state]").forEach(div => {
        if (div.dataset.state === name) {
            div.classList.add("active")
        } else {
            div.classList.remove("active")
        }
    })
}

function updateCryContainer(label, state, colorID) {
    document.querySelector("#tribe-cry-container .text").innerText = label
    showCryBtns(state)
    document.documentElement.style.setProperty('--color-state', "var(--color-secondary-"+colorID+")")
}

updateCryContainer("Enregistre un cri de 5 secondes pour ta tribu !", "no-audio", 1)

cryBtns.record.addEventListener("click", () => {
    recorder.record(() => {
        let i=5
        const update = () => {
            const str = "00:00:0" + Math.max(i, 0)
            cryBtns.timer.innerText = str
        }
        const interval = setInterval(() =>  i--<0 ? clearInterval(interval) : update(), 1000);
    })
    .then(() => {
        recorder.upload().then((filepath) => {
            updateCryContainer("Mon cri de tribu", "done", 4)
            userData.audio = filepath
            updateCryMashupState()
        })
    })
    .catch((err) => {
        alert(err)
        updateCryContainer("Enregistre un cri de 5 secondes pour ta tribu !", "no-audio", 1)
    });
    updateCryContainer("Enregistrement en cours...", "recording", 3)
})

cryBtns.play.addEventListener("click", () => {
    if (userData.audio) {
        cryBtns.play.classList.add("disabled")
        const audio = document.createElement("audio")
        audio.src = document.WEBAPP_URL + "/tribe_audio/" + userData.audio
        audio.load()
        audio.play()
        audio.onended = () => {
            cryBtns.play.classList.remove("disabled")
        }
    }
})

cryBtns.restart.addEventListener("click", () => {
    updateCryContainer("Enregistre un cri de 5 secondes pour ta tribu !", "no-audio", 1)
});

function initCryBoxState() {
    if (userData.audio) updateCryContainer("Mon cri de tribu", "done", 4)
}

// Tribe cry mashup

const mashupBtn = document.getElementById("btn-cry-tribe-mashup")
function updateCryMashupState() {
    if (userData.audio) {
        mashupBtn.classList.remove("hide")
    } else {
        mashupBtn.classList.add("hide")
    }
}

mashupBtn.addEventListener("click", () => {
    QUERY.getMashup().then(res => {
        if (res.status) {
            mashupBtn.classList.add("disabled");

            const audioFiles = [];
            let currentIndex = 0;
            
            const loadAllAudio = () => {
                for (let i = 0; i < res.data.length; i++) {
                    const audio = new Audio(document.WEBAPP_URL + "/tribe_audio/" + res.data[i]);
                    audioFiles.push(audio);
                }
                
                for (let i = 0; i < audioFiles.length - 1; i++) {
                    audioFiles[i].onended = () => {
                        currentIndex++;
                        audioFiles[currentIndex].play();
                    };
                }
                
                if (audioFiles.length > 0) {
                    audioFiles[audioFiles.length - 1].onended = () => {
                        mashupBtn.classList.remove("disabled");
                    };
                    
                    audioFiles[0].play();
                } else {
                    mashupBtn.classList.remove("disabled");
                }
            };
            
            loadAllAudio();
        }
    })
});