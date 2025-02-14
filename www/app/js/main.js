
/* temp : display errors as alerts */
window.onerror = function(message, source, lineno, colno, error) {
    alert("Error: " + message + "\nAt: " + source + "\nLine: " + lineno);
    return true;
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

async function after_user_load(uuid) {
    socketAuth(uuid)
    loadEvents()
    loadChats(userData.tribe_id)
    loadLeaderBoard()
    updateTrophies()
    updateProfilePicture()

    const tribes = await QUERY.getTribes()
    console.log(tribes)
    if (tribes.status) {
        document.getElementById("tribe-name").innerText = tribes.data[userData.tribe_id-1].name
    }
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

window.addEventListener("DOMContentLoaded", () => {
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
    const value = input_feedback.value
    if (value) {
        QUERY.sendFeedback(value).then(res => {
            if (res.status) {
                alert("Feedback sent !")
                input_feedback.value = ""
            }
        })
    }
})