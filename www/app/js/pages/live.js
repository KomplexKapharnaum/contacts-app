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
    }
}

let lastevent_id = null;
socket.on('start-event', (data_pack) => {

    console.log(data_pack)
    
    // const userGroup = userData.groups[0].name
    const data = data_pack[/*userGroup*/0]
    if (!data) {endEvent(); return}

    if (lastevent_id != data.id) receiveSessionEvent(data)
    lastevent_id = data.id
});

socket.on("reload", () => {
    location.reload();
})

endEvent = function() {
    showOverlay(false);
    USEREVENT.showVideo(false);
    PAGES.goto("live-idle");
}
