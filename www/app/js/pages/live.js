showOverlay = function(bool, color, message, image = false, flashing = false) {
    const overlay = document.getElementById("overlay");
    overlay.classList.remove("flashing");
    if (bool) {
        overlay.classList.add("active");
        if (flashing) overlay.classList.add("flashing");
        overlay.style.backgroundColor = color;
        overlay.innerHTML = message;

        if (image) {
            overlay.innerHTML = `<img src="${image}">`;
        }
    } else {
        overlay.classList.remove("active");
    }
}

USEREVENT = {}

USEREVENT.promptColors = function(colors, flashing) {
    PAGES.goto("live-color");
    container = document.getElementById("color-selection");
    container.innerHTML = "";
    colors.forEach((color) => {
        const div = document.createElement("div");
        div.style.backgroundColor = color;
        div.addEventListener("click", () => {
            showOverlay(true, color, "", false, flashing);
        });
        container.appendChild(div);
    });
}

USEREVENT.promptTexts = function(texts, flashing) {
    PAGES.goto("live-text");
    container = document.getElementById("text-selection");
    container.innerHTML = "";
    texts.forEach((text) => {
        const div = document.createElement("div");
        div.innerHTML = text;   
        div.addEventListener("click", () => {
            showOverlay(true, "black", text, false, flashing);
        });
        container.appendChild(div);
    });
}

USEREVENT.promptImages = function(images, flashing) {
    PAGES.goto("live-image");
    container = document.getElementById("image-selection");
    container.innerHTML = "";
    images.forEach((image) => {
        const div = document.createElement("div");
        div.style.backgroundImage = "url("+image+")";
        div.addEventListener("click", () => {
            showOverlay(true, "", "", image, flashing);
        });
        container.appendChild(div);
    });
}

USEREVENT.setOverlay = function(type, args, params) {

    const flashing = params.flash || false;
    const randomSelect = params.random || false;
    const switchonclick = params.loop || false;

    const shuffledArgs = args.sort(() => Math.random() - 0.5);

    const show = (val) => {
        switch (type) {
            case "color":
                showOverlay(true, val, "", false, flashing);
                break;
            case "text":
                showOverlay(true, "black", val, false, flashing);
                break;
            case "image":
                showOverlay(true, "black", "", val, flashing);
                break;
        }
    }

    const rndID = () => {
        const args_len = shuffledArgs.length;
        return Math.floor(Math.random()*args_len);
    }

    let id = rndID();

    if (args.length>1) {
        if (randomSelect) {
            show(shuffledArgs[id]);
        } else {
            switch(type) {
                case "color":
                    USEREVENT.promptColors(shuffledArgs, flashing);
                    break;
                case "text":
                    USEREVENT.promptTexts(shuffledArgs, flashing);
                    break;
                case "image":
                    USEREVENT.promptImages(shuffledArgs, flashing);
                    break;
            }
        }
    } else {
        show(shuffledArgs[0]);
    }

    if (switchonclick) {
        document.getElementById("overlay").onclick = function() {
            id = (id + 1) % shuffledArgs.length;
            show(shuffledArgs[id]);
        };
    }
}

const video_overlay_media = document.querySelector("#video-overlay video");
USEREVENT.showVideo = function(show) {
    const overlay = document.getElementById("video-overlay");

    if (show) {
       overlay.classList.add("active");
       video_overlay_media.src = show;
       video_overlay_media.load();
    } else {
       overlay.classList.remove("active");
    }
}

video_overlay_media.addEventListener("loadeddata", () => {
    video_overlay_media.play();
});

USEREVENT.processQuestions = function(questions) {
    PAGES.goto("live-questions");
    const question = document.getElementById("live-questions-message");
    const answer = document.getElementById("live-questions-input");
    const next = document.getElementById("live-questions-send");

    const nextQuestion = () => {
        const msg = questions.shift();
        question.innerHTML = msg;
        answer.value = "";
        answer.focus();

        const event = () => {
            const packet = {
                question: msg,
                answer: answer.value
            }

            document.SOCKETIO.emit("live-question", packet);

            if (questions.length>0) {
                nextQuestion();
            } else {
                PAGES.goto("live-info");
                document.getElementById("live-info-message").innerHTML = "Vous avez fini la série de questions !";
            }
            next.removeEventListener("click", event);
        }

        next.addEventListener("click", event);
    }

    nextQuestion();
}

/* File upload */

const btn_live_upload = document.getElementById("live-upload-button");
btn_live_upload.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > 512) {
                    height = Math.round((height * 512) / width);
                    width = 512;
                }
            } else {
                if (height > 512) {
                    width = Math.round((width * 512) / height);
                    height = 512;
                }
            }
            
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                const formData = new FormData();
                formData.append("image", blob, "image.jpg");
                formData.append("uuid", userData.uuid);
                
                fetch("/live_file_upload", {
                    method: "POST",
                    body: formData
                }).then((res) => {
                    alert("Image envoyée !");
                }).catch((err) => {
                    console.error(err);
                });
            }, "image/jpeg", 0.85);
            
        };
        
        // Create object URL from the selected file
        img.src = URL.createObjectURL(file);
    });
    input.click();
});

receiveSessionEvent = function (event) {

    console.log(event)

    if (event.name=="reload") location.reload();
    if (event.name=="end") endEvent();

    document.getElementById("overlay").onclick = null;
    if (!isEventLive) return;
    showOverlay(false);
    USEREVENT.showVideo(false);
    let container;
    switch (event.name) {
        case "color":
            USEREVENT.setOverlay(event.name, event.args.colors, event.args.params);
            break;
        case "text":
            USEREVENT.setOverlay(event.name, event.args.texts, event.args.params);
            break;
        case "image":
            USEREVENT.setOverlay(event.name, event.args.images, event.args.params);
            break;
        case "info":
            PAGES.goto("live-info");
            document.getElementById("live-info-message").innerHTML = event.args.message; 
            break;
        case "video":
            USEREVENT.showVideo(event.args.url);
            break;
        case "question":
            USEREVENT.processQuestions(event.args.questions);
            break;
        case "upload":
            PAGES.goto("live-upload");
            break;
    }
}

let lastevent_id = null;
document.SOCKETIO.on('start-event', (data_pack) => {
    
    // const userGroup = userData.groups[0].name
    const data = data_pack[/*userGroup*/0]
    if (!data) {endEvent(); return}

    if (lastevent_id != data.id) receiveSessionEvent(data)
    lastevent_id = data.id
});

document.SOCKETIO.on("reload", () => {
    location.reload();
})

endEvent = function() {
    showOverlay(false);
    USEREVENT.showVideo(false);
    PAGES.goto("live-idle");
}

document.querySelectorAll(".btn-live-close").forEach(el => {
    el.addEventListener("click", () => {
        lastevent_id=null
        socketEventLive(userData.uuid, false)
        showNavbar(true)
        PAGES.goto("cyberspace")
    })
});