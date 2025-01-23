const goto_onboarding_username = document.getElementById("goto-onboarding-username")

goto_onboarding_username.addEventListener("click", () => {	
    PAGES.goto("onboarding-username")
})

const onboarding_validate_username = document.getElementById("onboarding-validate-username")
const onboarding_input_username = document.getElementById("onboarding-input-username")
const onboarding_username_error = document.getElementById("onboarding-username-error")

let onboarding_userdata_buffer = {}

onboarding_validate_username.addEventListener("click", () => {
    const username = onboarding_input_username.value
    if (isUserNameValid(username)) {
        onboarding_userdata_buffer.username = username
        PAGES.goto("onboarding-tribe")
    }
})

function onboarding_create_user(username, tribeID) {
    QUERY.process("create_user", {name: username, tribe_id: tribeID}).then((res) => {
        if (res.status) {
            if (res.data.uuid) {
                userData = res.data
                Cookie.set("uuid", res.data.uuid)
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

/*
let avatar_creation_data = {}

const onboarding_camera = document.getElementById("onboarding-video")
const onboarding_video_capture = document.getElementById("onboarding-video-capture")
const onboarding_video_canvas = document.getElementById("onboarding-video-canvas")

const validate_buttons_container = document.getElementById("onboarding-video-validate-buttons")
const videovalidate_send = document.getElementById("onboarding-video-send")
const videovalidate_cancel = document.getElementById("onboarding-video-cancel")

function displayCameraButtons(bool1, bool2) {
    validate_buttons_container.style.display = bool1 ? "flex" : "none"
    onboarding_video_capture.style.display = bool2 ? "block" : "none"
}

function startCamera() {

    displayCameraButtons(false, false)

    avatar_creation_data = {}

    const constraints = {
        audio: false,
        video: { width: { ideal: 400 }, height: { ideal: 400 } }
    }

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        onboarding_camera.srcObject = stream
        onboarding_camera.play()
        displayCameraButtons(false, true)
        onboarding_video_capture.addEventListener("click", () => {
            stream.getTracks().forEach(track => track.stop())
        })
    })
    .catch(error => {
        console.error('Error opening video camera.', error)
    })
}

PAGES.addCallback("onboarding-selfie", () => {
    startCamera()
})

onboarding_video_capture.addEventListener("click", () => {
    const context = onboarding_video_canvas.getContext("2d")
    context.drawImage(video_debug, 0, 0, onboarding_video_canvas.width, onboarding_video_canvas.height)

    displayCameraButtons(true, false)

    videovalidate_cancel.addEventListener("click", () => {
        startCamera()
    })

    videovalidate_send.addEventListener("click", () => {
        avatar_creation_data.avatar = onboarding_video_canvas.toDataURL("image/png")
        PAGES.goto("onboarding-questions-01")
    })
})
    */