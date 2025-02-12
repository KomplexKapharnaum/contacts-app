const goto_onboarding_username = document.getElementById("goto-onboarding-username")

goto_onboarding_username.addEventListener("click", () => {	
    PAGES.goto("onboarding-username")
})

const onboarding_validate_username = document.getElementById("onboarding-validate-username")
const onboarding_input_username = document.getElementById("onboarding-input-username")
const onboarding_username_error = document.getElementById("onboarding-username-error")

let onboarding_userdata_buffer = {}

onboarding_input_username.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
        onboarding_validate_username.click()
    }
})

onboarding_validate_username.addEventListener("click", () => {
    const username = onboarding_input_username.value
    const valid = isUserNameValid(username)
    if (valid[0]) {
        onboarding_userdata_buffer.username = username
        PAGES.goto("onboarding-tribe")
    } else {
        onboarding_username_error.innerText = valid[1]
    }
})

function onboarding_create_user(username, tribeID) {
    QUERY.process("create_user", {name: username, tribe_id: tribeID}).then((res) => {
        if (res.status) {
            if (res.data.uuid) {
                userData = res.data
                document.CONFIG.set("uuid", res.data.uuid)
                BUD.setCurrentDialogue(BUD_DIALS.welcome, true)
                subscribeToSession(res.data.uuid)
            } else {
                onboarding_username_error.innerText = "Une erreur est survenue"
            }
        } else {
            onboarding_username_error.innerText = res.data
        }
    })
}

const onboarding_tribes_container = document.getElementById("onboarding-tribe-selector")
const template_onboarding_tribe = document.getElementById("tem-onboarding-tribe")
const onboarding_tribe_validate = document.getElementById("onboarding-validate-tribe")

PAGES.addCallback("onboarding-tribe", async () => {
    onboarding_tribes_container.innerHTML = ""
    const tribes = await QUERY.getTribes()
    let containers = []
    if (tribes.status) {
        tribes.data.forEach(tribe => {
            const btn = template_onboarding_tribe.cloneNode(true)
            .content.querySelector(".tribe-container")
            
            btn.style.setProperty("--tribe-color", tribe.color)

            const capitalized =
            tribe.name.charAt(0).toUpperCase()
            + tribe.name.slice(1)

            btn.querySelector("button").innerText = capitalized

            onboarding_tribes_container.appendChild(btn)
            
            btn.querySelector("button").addEventListener("click", () => {
                containers.forEach(e => e.classList.remove("active"))
                onboarding_userdata_buffer.tribeID = tribe.id

                btn.classList.add("active")
                onboarding_tribe_validate.classList.add("active")
                onboarding_tribe_validate.innerText = "Rejoindre la tribu " + tribe.name
            })
            
            containers.push(btn)
        });
    }
})

onboarding_tribe_validate.addEventListener("click", () => {
    onboarding_create_user(
        onboarding_userdata_buffer.username, 
        onboarding_userdata_buffer.tribeID
    )
})