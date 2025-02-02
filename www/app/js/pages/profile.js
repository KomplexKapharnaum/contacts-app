
document.getElementById("profile-delete").addEventListener("click", () => {
    showNavbar(false)
    app_confirm("Voulez-vous supprimer votre compte ?").then((res) => {
        if (res) {
            PAGES.goto("loading")
            QUERY.process("remove_user", {uuid: userData.uuid}).then(() => {
                userData = {}
                document.CONFIG.remove("uuid")
                hasEventsLoaded = false
                loadUser()
            })
        } else {
            PAGES.goto("profile")
            showNavbar(true)
        }
    })
})

document.getElementById("profile-edit-username").addEventListener("click", () => {
    showNavbar(false)
    app_prompt("Quel est votre nouveau pseudo ?").then((res) => {
        if (res) {
            PAGES.goto("loading")
            QUERY.updateName(res).then(() => {
                PAGES.goto("profile")
                showNavbar(true)
            })
        } else {
            PAGES.goto("profile")
            showNavbar(true)
        }
    })
})


const tem_trophy = document.getElementById("tem-trophy")
const trophies_container = document.getElementById("trophies")
function updateTrophies() {
    trophies_container.innerHTML = ""
    fetch(document.WEBAPP_URL+"/trophies")
    .then(res => res.json())
    .then(data => {
        for (let [id, info] of Object.entries(data)) {
            const clone = tem_trophy.cloneNode(true).content
            const trophy = clone.querySelector(".trophy")
            trophy.dataset.id = id
            
            trophy.style.setProperty("--trophy-image", `url(${document.BASEPATH}/img/trophies/${info.img}.png)`)
            clone.querySelector(".info").innerHTML = `${info.name} : ${info.desc}`

                trophy.addEventListener("click", () => {
                    trophies_container.querySelectorAll(".trophy").forEach(t => t.classList.remove("active"))
                    trophy.classList.add("active")
                })

            trophies_container.appendChild(clone)
        }
        document.addEventListener("click", (ev) => {
            if (ev.target.classList.contains("trophy")) return
            trophies_container.querySelectorAll(".trophy").forEach(t => t.classList.remove("active"))
        })
        updateTrophiesState()
    })
}

function updateTrophiesState() {
    trophies_container.querySelectorAll(".trophy").forEach(t => {
        if (userData.trophies.includes(t.dataset.id)) t.classList.add("obtained")
        else t.classList.remove("obtained")
    })
}

const notif_container = document.getElementById("notifications-container")
const tem_notification = document.getElementById("tem-notification")
function showNotification(text, color, priority, button_label=false, onlcick=false) {
    const clone = tem_notification.cloneNode(true).content
    .querySelector(".notification")

    clone.querySelector("span").innerText = text
    clone.classList.add(color)

    clone.style.order = priority

    if (button_label) {
        clone.querySelector("button").innerText = button_label
        clone.querySelector("button").classList.add("show")
        clone.querySelector("button").addEventListener("click", onlcick)
    }

    notif_container.appendChild(clone)
}

showNotification("test", "cyberspace", 0, "test", () => {alert(1)})

/* Avatar creation related */
let avatar_creation_data = {};

const avatar_creation_subpages = document.querySelectorAll(".avatar-subpage");
function open_avatar_subpage(id) {
    avatar_creation_subpages.forEach(subpage => {
        if (subpage.dataset.subpageId == id) subpage.classList.add("active");
        else subpage.classList.remove("active");
    });
}

const avatar_creation_next = document.getElementById("avatar-creation-next");
let avatar_creation_state = 0;
const set_avatarnext_available = (bool) => avatar_creation_next.classList.toggle("enabled", bool);

const video_avatar = document.getElementById("video-avatar");
const video_avatar_canvas = document.getElementById("video-avatar-canvas");

const video_avatar_capture = document.getElementById("video-avatar-capture");
const video_avatar_retry = document.getElementById("video-avatar-retry");

function avatar_start_camera() {
    open_avatar_subpage(0)

    avatar_creation_state=0;
    set_avatarnext_available(false);

    video_avatar_canvas.classList.remove("active")
    video_avatar.classList.add("active")
    video_avatar_capture.classList.add("active")
    video_avatar_retry.classList.remove("active")

    const constraints = {
        audio: false,
        video: { width: { ideal: 400 }, height: { ideal: 400 } }
    };

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        video_avatar.srcObject = stream;
        video_avatar.play();
        video_avatar_capture.addEventListener("click", () => {
            stream.getTracks().forEach(track => track.stop());
            set_avatarnext_available(true);
        });
    })
    .catch(error => {
        console.error('Error opening video camera.', error);
    });
}

video_avatar_capture.addEventListener("click", () => {
    video_avatar_canvas.classList.add("active")
    video_avatar.classList.remove("active")
    video_avatar_capture.classList.remove("active")
    video_avatar_retry.classList.add("active")

    const context = video_avatar_canvas.getContext("2d");
    context.drawImage(video_avatar, 0, 0, video_avatar_canvas.width, video_avatar_canvas.height);
    avatar_creation_data.photo = video_avatar_canvas.toDataURL();
})

PAGES.addCallback("avatar-creation", () => {
    avatar_start_camera();
})

video_avatar_retry.addEventListener("click", () => {
    avatar_start_camera()
})

/* Canvas paint */

const btns_paint = document.getElementById("paint-buttons")
const cnv_paint = document.getElementById("canvas-paint")
const ctx_paint = cnv_paint.getContext("2d")

ctx_paint.lineCap = "round"

cnv_paint.width = 512
cnv_paint.height = 512

let paint_data = {
    color: "white",
    size: 1,
    prevX: 0,
    prevY: 0,
    down: false
}

function draw(x, y, e) {
    ctx_paint.beginPath();
    ctx_paint.lineCap = "round";
    ctx_paint.strokeStyle = paint_data.color;
    ctx_paint.lineWidth = paint_data.size;
    ctx_paint.moveTo(paint_data.prevX, paint_data.prevY);
    ctx_paint.lineTo(x, y);
    ctx_paint.stroke();
    paint_data.prevX = x;
    paint_data.prevY = y;
}

function setActiveColor(btn) {
    btns_paint.querySelectorAll("button").forEach(b => b.classList.remove("active"))
    btn.classList.add("active")
}

function addButton(color) {
    const btn = document.createElement("button")
    btn.style.backgroundColor = color
    btn.addEventListener("click", () => {
        setActiveColor(btn)
        paint_data.color = color
    })
    btns_paint.appendChild(btn)
    return btn
}

const default_color = addButton("#FFF")
addButton("#F00")
addButton("#0F0")
addButton("#00F")

setActiveColor(default_color)

cnv_paint.addEventListener("mousedown", (e) => {
    paint_data.down = true
    const bounds = cnv_paint.getBoundingClientRect()
    paint_data.prevX = e.offsetX / bounds.width * cnv_paint.width
    paint_data.prevY = e.offsetY / bounds.height * cnv_paint.height
})
cnv_paint.addEventListener("mouseup", () => {paint_data.down = false})

cnv_paint.addEventListener("mousemove", (e) => {
    const bounds = cnv_paint.getBoundingClientRect()
    if (paint_data.down) {
        draw(e.offsetX / bounds.width * cnv_paint.width, e.offsetY / bounds.height * cnv_paint.height)
    }
})

function setBrushSize(size) {
    paint_data.size = size
    // document.getElementById("brush-size-preview").style.width = `${size}px`
    // document.getElementById("brush-size-preview").style.height = `${size}px`
}
setBrushSize(16)

const avatar_creation_states = document.querySelectorAll("#avatar-creation-state .state-box")
function set_avatar_creation_indicator_part(id) {
    avatar_creation_states.forEach(s => s.classList.remove("active"))
    avatar_creation_states[id].classList.add("active")
}

/* Next button */
avatar_creation_next.addEventListener("click", () => {
    switch (avatar_creation_state) {
        case 0:
            open_avatar_subpage(1)
            document.getElementById("canvas-paint").style.backgroundImage = `url(${avatar_creation_data.photo})`
            document.getElementById("canvas-paint").getContext("2d").clearRect(0, 0, 512, 512);
            avatar_creation_state=1;
            break;
        case 1:
            avatar_creation_data.paint = cnv_paint.toDataURL();
            open_avatar_subpage(2)
            avatar_creation_state=2;
            break;
        case 2:
            avatar_creation_state=0;
            PAGES.goto("profile")
    }
    set_avatar_creation_indicator_part(avatar_creation_state)
})

document.getElementById("profile-edit-avatar").addEventListener("click", () => {
    PAGES.goto("avatar-creation")
    set_avatar_creation_indicator_part(0)
})