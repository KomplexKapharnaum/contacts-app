
document.getElementById("profile-delete").addEventListener("click", () => {
    showNavbar(false)
    app_confirm("Voulez-vous supprimer votre compte ?").then((res) => {
        if (res) {
            PAGES.goto("loading")
            QUERY.process("remove_user", {uuid: userData.uuid}).then(() => {
                userData = false
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
                updateProfileUsername(res)
                PAGES.goto("profile")
                showNavbar(true)
            })
        } else {
            PAGES.goto("profile")
            showNavbar(true)
        }
    })
})


let TROPHYDATA = {};
const tem_trophy = document.getElementById("tem-trophy")
const trophies_container = document.getElementById("trophies")
function updateTrophies() {
    trophies_container.innerHTML = ""
    fetch(document.WEBAPP_URL+"/trophies")
    .then(res => res.json())
    .then(data => {
        TROPHYDATA = data
        for (let [id, info] of Object.entries(data)) {
            const clone = tem_trophy.cloneNode(true).content
            const trophy = clone.querySelector(".trophy")
            trophy.dataset.id = id
            
            trophy.style.setProperty("--trophy-image", `url(${document.BASEPATH}/img/trophies/${id}.png)`)
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

const trophy_notif_container = document.getElementById("trophy-reward-overlay")
const tem_trophy_item = document.getElementById("tem-trophy-notif")

function rewardUserTrophy(trophyID) {
    if (!userData) return
    const trophyInfo = TROPHYDATA[trophyID]
    if (trophyInfo) {
        console.log("trophy_reward", trophyID)
        userData.trophies.push(trophyID)
        updateTrophiesState()
        
        const clone = tem_trophy_item.cloneNode(true).content
        const item = clone.querySelector(".trophy-reward-item")
        item.querySelector("img").src = `${document.BASEPATH}/img/trophies/${trophyID}.png`
        item.querySelector(".trophy-reward-name").innerText = trophyInfo.name
        item.querySelector(".trophy-reward-desc").innerText = trophyInfo.desc
        item.addEventListener("click", () => {
            item.remove()
        })

        trophy_notif_container.appendChild(item)
    }
}

const notif_container = document.getElementById("notifications-container")
const tem_notification = document.getElementById("tem-notification")
function showNotification(text, color, priority, button_label=false, onlcick=false) {
    const clone = tem_notification.cloneNode(true).content.querySelector(".notification")

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

let notifications_loaded = false;
PAGES.addCallback("notifications", () => {

    // load notifications
    if (!notifications_loaded) {
        notif_container.innerHTML = ""
        QUERY.getNotifications().then(res => {
            console.log(res)
            if (res.status) {
                notifications_loaded = true
                for (let notif of res.data) {
                    showNotification(notif.message, notif.color, 0)
                }
            }
        })
    }
})

// showNotification("test", "cyberspace", 0, "test", () => {alert(1)})


/* Avatar creation related */
const AVATAR_SIZE = 1024

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
video_avatar_canvas.width = AVATAR_SIZE;
video_avatar_canvas.height = AVATAR_SIZE;

const video_avatar_capture = document.getElementById("video-avatar-capture");
const video_avatar_retry = document.getElementById("video-avatar-retry");

function avatar_start_camera() {
    open_avatar_subpage(0)

    avatar_creation_state=0;
    set_avatarnext_available(false);

    video_avatar_canvas.classList.remove("active")
    video_avatar.classList.add("active")
    video_avatar_capture.classList.remove("active")
    video_avatar_retry.classList.remove("active")

    // // IN APP
    // if (navigator.camera) 
    // {
    //     var options = {
    //         quality: 100,
    //         cameraDirection: Camera.Direction.FRONT,
    //         destinationType: Camera.DestinationType.FILE_URI,
    //         sourceType: Camera.PictureSourceType.CAMERA,
    //         encodingType: Camera.EncodingType.JPEG,
    //         mediaType: Camera.MediaType.PICTURE,
    //         allowEdit: true,
    //         correctOrientation: true,
    //         targetHeight: 1024,
    //         targetWidth: 1024
    //     }
    //     console.log("Camera options", JSON.stringify(options))

    //     navigator.camera.getPicture(onSuccess, onFail, options);
        
    //     function onSuccess(imageURI) {
    //         window.resolveLocalFileSystemURL(imageURI, (entry) => {
    //             var img = new Image();
    //             img.src = entry.toURL()
    //             img.onload = () => {
    //                 process_snapshot(img);
    //                 set_avatarnext_available(true);
    //             }
    //         }, onFail);
    //     }
    //     function onFail(message) {
    //         console.error('camera Failed because: ' + message);
    //     }
    // }
    // // BROWSER
    // else {
        const constraints = {
            audio: false,
            video: { width: { ideal: 400 }, height: { ideal: 400 } },
            facingMode: {exact: 'user'}
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                video_avatar_capture.classList.add("active")
                video_avatar.srcObject = stream;
                video_avatar.play();

                video_avatar_capture.addEventListener("click", () => {
                    
                    video_avatar.height = video_avatar.videoHeight;
                    video_avatar.width = video_avatar.videoWidth;
                    
                    process_snapshot(video_avatar);
                    set_avatarnext_available(true);
                    
                    stream.getTracks().forEach(track => track.stop());

                    if (navigator.vibrate) navigator.vibrate(1000);
                    else console.error("Vibration not supported")

                });
            })
            .catch(error => {
                console.error('Error opening video camera.', JSON.stringify(error));
            });
    // }
    
}

function process_snapshot(img) 
{
    video_avatar_canvas.classList.add("active")
    video_avatar.classList.remove("active")
    video_avatar_capture.classList.remove("active")
    video_avatar_retry.classList.add("active")

    const context = video_avatar_canvas.getContext("2d");

    const canvasWidth = video_avatar_canvas.width;
    const canvasHeight = video_avatar_canvas.height;
    
    const ratio = img.width / img.height;
    
    const canvasRatio = canvasWidth / canvasHeight;

    let sx, sy, sWidth, sHeight;
    if (ratio > canvasRatio) {
        sWidth = img.height * canvasRatio;
        sHeight = img.height;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = img.width;
        sHeight = img.width / canvasRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }

    // mirror the image
    context.save();
    context.scale(-1, 1);
    context.drawImage(img, sx, sy, sWidth, sHeight, -canvasWidth, 0, canvasWidth, canvasHeight);
    context.restore(); 

    avatar_creation_data.photo = video_avatar_canvas.toDataURL();
}

PAGES.addCallback("avatar-creation", () => {

    // check if cordova is available
    if (typeof cordova !== 'undefined' && cordova.plugins.permissions)
    {
        cordova.plugins.permissions.requestPermission(cordova.plugins.permissions.CAMERA, 
            (status) => {
                if(status.hasPermission) avatar_start_camera();
                else console.error("CAMERA Permission denied")
            }, () => {
                console.error("CAMERA Permission denied")
            });
    }
    else avatar_start_camera();

    // const default_color = addButton("#FFF")
    // addButton("#F00")
    // addButton("#0F0")
    // addButton("#00F")
    // setActiveColor(default_color)
    addButtons()
})

video_avatar_retry.addEventListener("click", () => {
    avatar_start_camera()
})

/* Canvas paint */
const btns_paint = document.getElementById("paint-buttons")
const cnv_paint = document.getElementById("canvas-paint")
const ctx_paint = cnv_paint.getContext("2d")
let canvas_painted = false

ctx_paint.lineCap = "round"

cnv_paint.width = AVATAR_SIZE
cnv_paint.height = AVATAR_SIZE

let paint_data = {
    color: false,
    size: 1,
    prevX: 0,
    prevY: 0,
    down: false,
    erasing: false
}

function draw(x, y) {
    ctx_paint.beginPath();
    ctx_paint.lineCap = "round";
    if (paint_data.erasing) {
        ctx_paint.globalCompositeOperation = "destination-out"
    }
    ctx_paint.strokeStyle = paint_data.color;
    ctx_paint.lineWidth = paint_data.size;
    ctx_paint.moveTo(paint_data.prevX, paint_data.prevY);
    ctx_paint.lineTo(x, y);
    ctx_paint.stroke();
    if (paint_data.erasing) {
        ctx_paint.globalCompositeOperation = "source-over"
    }
    paint_data.prevX = x;
    paint_data.prevY = y;
    canvas_painted = true
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
        paint_data.erasing = false
    })
    btns_paint.appendChild(btn)

    if (!paint_data.color) {
        setActiveColor(btn)
        paint_data.color = color
        paint_data.erasing = false
    }
    return btn
}

function addButtons() {
    btns_paint.innerHTML = ""
    
    JSON.parse(DATA_TRIBES[userData.tribe_id-1].colors).slice(1).forEach(tribeColor => {
        addButton(tribeColor)
    })

    const erase_button = document.createElement("button")
    erase_button.classList.add("erase")
    erase_button.innerHTML = "X"
    erase_button.addEventListener("click", () => {
        setActiveColor(erase_button)
        paint_data.erasing = true
    })
    btns_paint.appendChild(erase_button)
}

function getCanvasCoords(canvas, event) {
    const bounds = canvas.getBoundingClientRect();
    if (event.touches) { // Touch event
      return {
        x: (event.touches[0].clientX - bounds.left) * (canvas.width / bounds.width),
        y: (event.touches[0].clientY - bounds.top) * (canvas.height / bounds.height)
      };
    } else { // Mouse event
      return {
        x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
        y: (event.clientY - bounds.top) * (canvas.height / bounds.height)
      };
    }
}


function paint_handleStart(event) {
    event.preventDefault(); // Prevent scrolling on touch
    const { x, y } = getCanvasCoords(cnv_paint, event);
    paint_data.down = true
    paint_data.prevX = x
    paint_data.prevY = y
}

function paint_handleMove(event) {
    if (!paint_data.down) return;
    const { x, y } = getCanvasCoords(cnv_paint, event);
    draw(x, y)
}

function paint_handleEnd(event) {
  event.preventDefault();
  paint_data.down = false
}


cnv_paint.addEventListener('mousedown', paint_handleStart);
cnv_paint.addEventListener('mousemove', paint_handleMove);
cnv_paint.addEventListener('mouseup', paint_handleEnd);
cnv_paint.addEventListener('touchstart', paint_handleStart);
cnv_paint.addEventListener('touchmove', paint_handleMove);
cnv_paint.addEventListener('touchend', paint_handleEnd);

document.getElementById("btn-avatar-draw-clear").addEventListener("click", () => {
    ctx_paint.clearRect(0, 0, cnv_paint.width, cnv_paint.height)
    canvas_painted = false
})

function setBrushSize(size) {
    paint_data.size = size
    // document.getElementById("brush-size-preview").style.width = `${size}px`
    // document.getElementById("brush-size-preview").style.height = `${size}px`
}
setBrushSize(40)

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
            document.getElementById("canvas-paint").getContext("2d").clearRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
            canvas_painted = false
            avatar_creation_state=1;
            break;
        case 1:
            if (!canvas_painted) {
                alert("Veuillez dessiner sur votre avatar !")
                return;
            }
            avatar_creation_data.paint = cnv_paint.toDataURL();
            open_avatar_subpage(2)
            avatar_creation_state=2
            genNewAvatar(userData.uuid, avatar_creation_data)
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

function base64ToBlob(base64) {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

function genNewAvatar(userID, data) {
    // document.SOCKETIO.emit("gen-avatar", {userID: userID, data: data})

    const form = new FormData();
    form.append("uuid", userID);
    form.append("selfie", base64ToBlob(data.photo));
    form.append("paint", base64ToBlob(data.paint));

    fetch(document.WEBAPP_URL+"/gen_avatar", {
        method: "POST",
        body: form
    })
    .then((res) => {
        if (res.ok) {
            // alert("Avatar en cours de création !")
            avatar_creation_state=0;
            PAGES.goto("profile")
        } else {
            console.error("Error sending data")
        }
    })

}

document.getElementById("profile-save-avatar").addEventListener("click", () => {
    // const avatar = document.getElementById("profile-avatar");
    // const link = document.createElement("a");
    // link.href = avatar.src;
    // link.download = "avatar.png";
    // link.click();
    downloadImage(document.getElementById("profile-avatar").src, "avatar.png")
})

/* Avatar votes */

const avatar_vote_image = document.getElementById("avatar-vote-image")
const avatar_vote_yes = document.getElementById("avatar-vote-yes")
const avatar_vote_no = document.getElementById("avatar-vote-no")

function newAvatarVote(user_id, avatar_path) {
    return new Promise((resolve, reject) => {
        avatar_vote_image.src = document.WEBAPP_URL + "/avatars/" + avatar_path
        avatar_vote_image.alt = user_id

        const vote_yes = () => {
            avatar_vote_yes.removeEventListener("click", vote_yes)
            avatar_vote_no.removeEventListener("click", vote_no)
            document.SOCKETIO.emit("vote-avatar", {user_id, vote: true})
            resolve("yes")
        }
        const vote_no = () => {
            avatar_vote_yes.removeEventListener("click", vote_yes)
            avatar_vote_no.removeEventListener("click", vote_no)
            document.SOCKETIO.emit("vote-avatar", {user_id, vote: false})
            resolve("no")
        }

        avatar_vote_yes.addEventListener("click", vote_yes)
        avatar_vote_no.addEventListener("click", vote_no)
    })
}

async function processAvatarVotes(avatar_data) {
    return new Promise(async (resolve, reject) => {
        for (let avatar of avatar_data) {
            await newAvatarVote(avatar.user_id, avatar.avatar_path)
        }
        resolve()
    })
}

function startAvatarVotes() {
    PAGES.goto("loading")
    QUERY.process("random_avatars", {uuid: userData.uuid}).then((res) => {
        console.log(res)
      if (res.status) {
        PAGES.goto("avatar-vote")
        processAvatarVotes(res.data).then(() => {
            PAGES.goto("profile")
        })
      } else {
        alert("une erreur est survenue.")
        PAGES.goto("profile")
      }
    });
}

function updateProfilePicture() {
    if (!userData) return;

    if (userData.avatar) {
        document.getElementById("profile-avatar-btns").classList.remove("disabled")
        switch (userData.avatar) {
            case "pending":
                document.getElementById("profile-avatar").src = document.BASEPATH + "/img/gen_loading.png"
                document.getElementById("profile-avatar-btns").classList.add("disabled")
                break;
            case "error":
                document.getElementById("profile-avatar").src = document.BASEPATH + "/img/avatar_default.png"
                break;
            default:
                document.getElementById("profile-avatar").src = document.WEBAPP_URL + "/avatars/" + userData.avatar
                break;
        }
    }
}

const input_profile_desc = document.getElementById("input-profile-description")
const btn_profile_desc = document.getElementById("input-profile-save")

btn_profile_desc.addEventListener("click", () => {
    QUERY.updateDescription(input_profile_desc.value).then(() => {
        alert("Description mise à jour !")
    })
})

const profile_avatarvote_container = document.getElementById("avatar-vote-container")
const profile_avatarvote_text = document.getElementById("avatar-vote-text")
const profile_avatarvote_btn = document.getElementById("avatar-vote-btn")

function setProfileAvatarVoteStateFromUserData() {
    if (userData) {
        const last_time_voted = userData.stats.last_time_voted
        if (last_time_voted) {
            const today = new Date().setHours(0, 0, 0, 0)
            const last_time_voted_today = new Date(last_time_voted).setHours(0, 0, 0, 0)
            if (today === last_time_voted_today) {
                setProfileAvatarVoteState(false)
            }
        }
    }
}

function setProfileAvatarVoteState(state) {
    if (state) {
        profile_avatarvote_container.classList.remove("disabled")
        profile_avatarvote_text.innerText = "Votre vote journalier d’avatars vous attend !"
        profile_avatarvote_btn.innerText = "Commencer le vote"
    } else {
        profile_avatarvote_container.classList.add("disabled")
        profile_avatarvote_text.innerText = "Vous avez déjà voté aujourd’hui !"
        profile_avatarvote_btn.innerText = "Revenez demain"
    }
}

profile_avatarvote_btn.addEventListener("click", () => {
    startAvatarVotes()
    setProfileAvatarVoteState(false)
})

function updateProfileUsername(name) {
    document.getElementById("user-username").innerText = name
}