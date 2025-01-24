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

function after_user_load(uuid) {
    socketAuth(uuid)
    loadEvents()
    loadChats(userData.tribe_id)
    loadLeaderBoard()
}

function subscribeToSession(uuid) {
    QUERY.getSession(uuid).then(res => {
        if(res.status && res.data) {
            const session = res.data
            app_confirm("Voulez-vous vous inscrire à la session ?").then(confirmed => {
                if (confirmed) {
                    QUERY.subscribeToSession(uuid, res.data).then(sub_res => {
                        if (sub_res.status) {
                            userData.subscribed_session = sub_res.data.session_id
                            after_user_load(uuid)
                        }
                    })
                } else {
                    PAGES.goto("home")
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
            if (bgColor) document.documentElement.style.setProperty('--bg-color', bgColor)
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

nav_goto("nav-profile", "profile", "var(--color-secondary-1)")
nav_goto("nav-tribe", "tribe", "var(--color-secondary-3)")
nav_goto("nav-cyberspace", "cyberspace", "var(--color-secondary-2)")

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
    document.getElementById("version").style.display = "block"
}
else {
    document.getElementById("version").style.display = "none"
}
