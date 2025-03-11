const ENUMS = {};
const CORDOVA_INFO = {};

function onDeviceReady() {
    if (!cordova) return
    if (!cordova.platformId == 'android' && !cordova.platformId == 'ios') return

    cordova.plugins.firebase.messaging.requestPermission().then(() => {
        console.log("FIREBASE: Push permission granted.")
        cordova.plugins.firebase.messaging.getToken().then(token => {
            console.log("FIREBASE: Token=", token)
            CORDOVA_INFO.token = token
        })
    }).catch(err => {
        console.error("FIREBASE: Push permission denied: ", err)
    })
}
document.addEventListener('deviceready', onDeviceReady, false)

window.onerror = function(message, source, lineno, colno, error) {
    alert("Error: " + message + "\nAt: " + source + "\nLine: " + lineno)
    return true
};

if ("virtualKeyboard" in navigator) {
    navigator.virtualKeyboard.overlaysContent = true;
}

var userData = {}
const cookie_uuid = document.CONFIG.get("uuid")
console.log("USER UUID: ", cookie_uuid)

showNavbar(false)

const confirm_text = document.getElementById("confirm-text")
const confirm_true = document.getElementById("input-confirm-true")
const confirm_false = document.getElementById("input-confirm-false")

async function app_confirm(text) {
    confirm_text.innerText = text
    PAGES.goto("app-confirm")
    return await new Promise((resolve, reject) => {
        confirm_true.addEventListener("click", () => resolve(true))
        confirm_false.addEventListener("click", () => resolve(false))
    })
}

const prompt_text = document.getElementById("prompt-text")
const prompt_input = document.getElementById("prompt-input")
const prompt_true = document.getElementById("input-prompt-validate")
const prompt_false = document.getElementById("input-prompt-back")

async function app_prompt(text) {
    prompt_input.value = ""
    prompt_text.innerText = text
    PAGES.goto("app-prompt")
    return await new Promise((resolve, reject) => {
        prompt_true.addEventListener("click", () => resolve(prompt_input.value))
        prompt_false.addEventListener("click", () => resolve(false))
    })
}

let DATA_TRIBES = {};
async function after_user_load(uuid) {

    try {
        cordova.plugins.firebase.messaging.subscribe("all")
        .then(function () {
            console.log("Successfully subscribed to the topic!");
        })
        .catch(function (error) {
            console.error("Error subscribing to the topic:", error);
        });
    }
    catch (e) {
        console.log("FIREBASE: Error subscribing to all: ", e)
    }

    socketAuth(uuid)
    loadFeatureStates()
    await loadEvents()
    await loadChats(userData.tribe_id)
    await loadLeaderBoard()
    await updateTrophies()
    await updateProfilePicture()
    setProfileAvatarVoteStateFromUserData()
    initCryBoxState()
    updateCryMashupState()

    if (userData.tribe_id) {
        const tribes = await QUERY.getTribes()
        
        if (tribes.status) {
            DATA_TRIBES = tribes.data
            document.getElementById("tribe-name").innerText = tribes.data[userData.tribe_id-1].name
        }
    } else {
        if (FEATURES.tribe_page) {
            PAGES.goto("onboarding-questions-fingerprint")
            BUD.setCurrentDialogue(BUD_DIALS.tribe_join, true)
            showNavbar(false)
        }
    }

    input_profile_desc.value = userData.description
}

function subscribeToSession(uuid) {
    QUERY.getSession(uuid).then(res => {
        if(res.status && res.data) {
            const session = res.data
            QUERY.subscribeToSession(uuid, res.data).then(sub_res => {
                if (sub_res.status) {
                    userData.subscribed_session = sub_res.data.session_id
                    after_user_load(uuid)
                }
            })
        }
    })
}

function loadUser() {
    if (cookie_uuid) {
        QUERY.getUser(cookie_uuid).then(res => {
            if (res.status) {
                userData = res.data
                if (!userData.subscribed_session) {subscribeToSession(userData.uuid)}
                else {
                    after_user_load(userData.uuid)
                }
            } else {
                document.CONFIG.remove("uuid")
                PAGES.goto("home")
            }
        })
    } else {
        PAGES.goto("home")
    }
}

PAGES.addCallback("home", () => {
    BUD.setCurrentDialogue(BUD_DIALS.introduction, true);
});


var FEATURES
window.addEventListener("DOMContentLoaded", async () => {
    loadFeatureStates()
    loadUser()
})

function nav_goto(id, page, bgColor=false, needsInternet=false) {
    
    document.getElementById(id).addEventListener("click", () => {
        if (!needsInternet || (needsInternet && navigator.onLine)) {
            PAGES.goto(page);
        }
    })
    
    const setActive = (isactive) => document.getElementById(id).classList.toggle("disabled", !isactive)
    
    if (needsInternet) {
        setActive(navigator.onLine)
        window.addEventListener("online", () => setActive(true))
        window.addEventListener("offline", () => setActive(false))   
    }
}
/*
nav_goto("nav-events", "events-list", true)
nav_goto("nav-share", "app-share")
// nav_goto("nav-photo", "debug-camera")
nav_goto("nav-chat", "chat", true)
*/

nav_goto("nav-profile", "profile")
nav_goto("nav-tribe", "tribe")
nav_goto("nav-cyberspace", "cyberspace")
nav_goto("nav-notifications", "notifications")

PAGES.setPageColor("profile", "var(--color-secondary-1)")
PAGES.setPageColor("tribe", "var(--color-secondary-3)")
PAGES.setPageColor("cyberspace", "var(--color-secondary-2)")
PAGES.setPageColor("notifications", "var(--color-secondary-4)")

PAGES.setPageColor("live-idle", "white")

PAGES.setHistoryState(["profile", "tribe", "cyberspace", "live-idle"], "purge")
PAGES.setHistoryState(["send-feedback", "notifications", "event-countdown", "event-location", "tribe-leaderboard"], "push")

// Accordions

function initAccordion(elm) {
    elm.querySelector("h2").addEventListener("click", () => {
        elm.classList.toggle("closed")
    })
}

const accordions = document.querySelectorAll(".accordion")
accordions.forEach(initAccordion)


// Version
if (document.APPVERSION) {
    document.getElementById("version").innerText = document.APPVERSION
    //     document.getElementById("version").style.display = "block"
}

const virtualKeyboardSupported = "virtualKeyboard" in navigator;
if (virtualKeyboardSupported) {
    navigator.virtualKeyboard.overlaysContent = true;
    navigator.virtualKeyboard.addEventListener("geometrychange", e => {
        let { x, y, width, height } = e.target.boundingRect;
        document.documentElement.style.setProperty('--offset', `-${height}px`)
    });
}

// Feedback

document.getElementById("send-feedback-button").addEventListener("click", ()=>PAGES.goto("send-feedback"))

const input_feedback = document.getElementById("input-feedback")
const send_feedback = document.getElementById("input-feedback-send")
send_feedback.addEventListener("click", () => {
    console.log("Sending feedback", input_feedback.value)
    let value = input_feedback.value
    if (value) {
        QUERY.sendFeedback(value).then(res => {
            if (res.status) {
                alert("Feedback sent !")
                input_feedback.value = ""
            }
        })
    }
})

const featurestates_elements = {
    tribe: document.getElementById("nav-tribe"),
    profile: document.getElementById("nav-profile"),
    gen_avatar: document.getElementById("avatar-container"),
    profile_desc: document.getElementById("profile-description-container"),
    tribe_cry: document.getElementById("tribe-cry"),
    vote_avatar: document.getElementById("avatar-vote-container"),
    cry_mashup: document.getElementById("btn-cry-tribe-mashup")
}

function feature_hide(featureElement) {
    featurestates_elements[featureElement].style.display = "none"
}

function feature_show(featureElement) {
    featurestates_elements[featureElement].style.display = "block"
}

function setFeatureState(featureElement, state) {
    if (state) feature_show(featureElement)
        else feature_hide(featureElement)
}

async function loadFeatureStates() {
    FEATURES = await QUERY.getFeatures()
    //  console.log("FEATURES: ", FEATURES)
    // setFeatureState("cyberspace", FEATURES.page_cyberspace)
    setFeatureState("tribe", FEATURES.tribe_page && userData.tribe_id)
    setFeatureState("profile", FEATURES.profile_page)
    setFeatureState("gen_avatar", FEATURES.profile_avatar)
    setFeatureState("profile_desc", FEATURES.profile_description)
    setFeatureState("tribe_cry", FEATURES.tribe_cry)
    setFeatureState("vote_avatar", FEATURES.tribe_avatar_vote)
    setFeatureState("cry_mashup", FEATURES.tribe_cry_mashup)
}

function gotoButtons() {
    const btns = document.querySelectorAll("button[data-gotopage]")
    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            PAGES.goto(btn.dataset.gotopage)
        })
    })
}
gotoButtons()

// PING PONG keep alivve
// Ask info every 5s, if no answer for 20s reload page
var lastAnswer = Date.now()
setInterval(() => {
    if (Date.now() - lastAnswer > 20000) {
        console.log("INFO pong not received for 20s, reloading")
        location.reload()
    }
    // console.log("ping")
    document.SOCKETIO.emit("ping")
}, 5000)
document.SOCKETIO.on("pong", (data) => {
    lastAnswer = Date.now()
    // console.log("pong")    
})

// ASK for update every 60s
setInterval(() => {
    document.SOCKETIO.emit("info-ping")
}, 60000)