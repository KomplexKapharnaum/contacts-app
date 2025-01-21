const goto_onboarding_username = document.getElementById("goto-onboarding-username")

goto_onboarding_username.addEventListener("click", () => {	
    PAGES.goto("onboarding-username")
})

const onboarding_username = document.getElementById("onboarding-validate-username")
const onboarding_input_username = document.getElementById("onboarding-input-username")
const onboarding_username_error = document.getElementById("onboarding-username-error")

onboarding_username.addEventListener("click", () => {
    const username = onboarding_input_username.value

    if (isUserNameValid(username)) {
        QUERY.process("create_user", {name: username}).then((res) => {
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
})

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