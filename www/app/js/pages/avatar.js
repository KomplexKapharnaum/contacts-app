let AVATAR_DATA = {}

// Math functions
// 

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

function map(value, min, max, nmin, nmax) {
    return (value - min) / (max - min) * (nmax - nmin) + nmin;
}

function constrain(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Media stream photo 
//

const vid = document.getElementById("media-stream");

function startMediaStream() {
    snapState = 3;
    reloadButton.style.visibility = "hidden";
    snapshotButton.textContent = "Chargement...";
    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 640 } } })
    .then((stream) => {
        vid.srcObject = stream;
        vid.play();
        snapshotButton.textContent = "Capturer";
        snapState = 0;
    })
    .catch((err) => {
        console.error(err);
    });
}

const snapshotButton = document.getElementById("media-stream-snapshot");
const reloadButton = document.getElementById("media-reload");
let snapState = 0;
let dataURL_media;

snapshotButton.addEventListener("click", function() {
    
    switch (snapState) {
        case 0: 
            const canvas = document.createElement("canvas");
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;

            canvas.getContext("2d").drawImage(vid, 0, 0, canvas.width, canvas.height);
            dataURL_media = canvas.toDataURL("image/png");

            vid.src = dataURL_media;
            snapshotButton.textContent = "Valider"
            reloadButton.style.visibility = "visible";

            snapState=1;
            break;
        case 1:         
            AVATAR_DATA.photo = dataURL_media;
            vid.srcObject.getTracks().forEach(track => track.stop());
            PAGES.goto("create_avatar_question1");
            break;
    }
});

reloadButton.addEventListener("click", function() {
    vid.srcObject.getTracks().forEach(track => track.stop());
    startMediaStream();
});

PAGES.addCallback("create_avatar_photo", startMediaStream);

// Anonymity mask question
//

const anonymityContainer = document.getElementById("anonymity-container");
const anonymityMask = document.getElementById("anonymity-mask");

function getMaskDistance() {
    const bounds = anonymityMask.getBoundingClientRect();
    const centerX = bounds.left + bounds.width/2;
    const centerY = bounds.top + bounds.height/2;

    const mbounds = anonymityContainer.getBoundingClientRect();
    const centerMX = mbounds.left + mbounds.width/2;
    const centerMY = mbounds.top + mbounds.height/2;

    return distance(centerX, centerY, centerMX, centerMY);
}

anonymityMask.addEventListener("touchstart", function(event) {
    const bounds = anonymityMask.getBoundingClientRect();
    const offsetX = event.touches[0].clientX - bounds.left;
    const offsetY = event.touches[0].clientY - bounds.top;

    function moveAnonymityMask(event) {
        const mbounds = anonymityContainer.getBoundingClientRect();
        let x = event.touches[0].clientX - offsetX - mbounds.left;
        let y = event.touches[0].clientY - offsetY - mbounds.top;

        x = Math.max(- anonymityMask.offsetHeight/2, Math.min(mbounds.width - anonymityMask.offsetWidth/2, x));
        y = Math.max(- anonymityMask.offsetHeight/2, Math.min(mbounds.height - anonymityMask.offsetHeight/2, y));

        anonymityMask.style.left = `${x}px`;
        anonymityMask.style.top = `${y}px`;

        const distance = getMaskDistance();
        const mapped = map(distance, 70, 5, 0, 100);
        const clamped = constrain(mapped, 0, 100);
    }

    function stopMovingAnonymityMask() {
        document.removeEventListener("touchmove", moveAnonymityMask);
        document.removeEventListener("touchend", stopMovingAnonymityMask);
    }

    document.addEventListener("touchmove", moveAnonymityMask);
    document.addEventListener("touchend", stopMovingAnonymityMask);
});

document.getElementById("question1-suivant").addEventListener("click", function() {
    PAGES.goto("create_avatar_question2");
});

// Cow eating question
// 

const cowCanvas = document.getElementById("cow-canvas");
const cowToMask = document.getElementById("cow-to-mask");
const cowCtx = cowCanvas.getContext("2d");

let cowData = {
    default: 0,
    current: 0
}

function getOpaquePixels() {
    const STEPS = 20;
    let opaque = 0;
    const imageData = cowCtx.getImageData(0, 0, cowCanvas.width, cowCanvas.height).data;
    
    for (let i = 0; i < imageData.length; i += 4 * STEPS) {
        const alpha = imageData[i + 3];
        if (alpha !== 0) {
            opaque++;
        }
    }
    
    return opaque;
}


let cowPrevCoords = false;
function drawCow(event) {
    const bounds = cowCanvas.getBoundingClientRect();

    cowCtx.beginPath();
        cowCtx.moveTo(cowPrevCoords.x - bounds.left, cowPrevCoords.y - bounds.top);
        cowCtx.lineTo(event.touches[0].clientX - bounds.left, event.touches[0].clientY - bounds.top);
        cowCtx.globalCompositeOperation = "destination-out";
    cowCtx.stroke();
    
    cowCtx.globalCompositeOperation = "source-over";
     

    cowData.current = getOpaquePixels();

    cowPrevCoords = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
    }
}

cowCanvas.addEventListener("touchstart", function(event) {
    cowCtx.lineWidth = 32;
    cowCtx.strokeStyle = "red";
    cowCtx.lineCap = "round";

    cowPrevCoords = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
    }
    cowCanvas.addEventListener("touchmove", drawCow);
});

cowCanvas.addEventListener("touchend", function() {
    cowCanvas.removeEventListener("touchmove", drawCow);
});

document.getElementById("cow-reset").addEventListener("click", function() {
    cowCtx.clearRect(0, 0, cowCanvas.width, cowCanvas.height);
    cowCtx.drawImage(cowToMask, 0, 0, cowCanvas.width, cowCanvas.height);
    cowData.current = getOpaquePixels();
});

PAGES.addCallback("create_avatar_question2", () => {
    cowCanvas.width = cowCanvas.offsetWidth;
    cowCanvas.height = cowCanvas.offsetHeight;

    cowToMask.onload = function() {
        cowCtx.drawImage(cowToMask, 0, 0, cowCanvas.width, cowCanvas.height);
        cowData.default = getOpaquePixels();
    }

    cowToMask.src = "img/questions/cow.png";
});

document.getElementById("question2-suivant").addEventListener("click", function() {
    // USER.addPrompt("viande", cowSlider.value);
    PAGES.goto("create_avatar_question3");
});

// Taille & poids / Height & weight
//



const buddyContainer = document.getElementById("tallfat-container");
const buddyResizable = document.getElementById("tallfat-buddy");
const buddyTopLeft = document.getElementById("resize-topleft");
const buddyBottomRight = document.getElementById("resize-bottomright");

const buddyMargin = 16;

function initBuddy() {
    buddyResizable.style.top = buddyMargin+"px";
    buddyResizable.style.left = buddyMargin+"px";
    buddyResizable.style.right = buddyMargin+"px";
    buddyResizable.style.bottom = buddyMargin+"px";
}
initBuddy();

/*
function updateBuddySliders() {
    const containerWidth = buddyContainer.offsetWidth - 2 * buddyMargin;
    const containerHeight = buddyContainer.offsetHeight - 2 * buddyMargin;

    const w = map(buddyResizable.offsetWidth, 40, containerWidth, 0, 100);
    const h = map(buddyResizable.offsetHeight, 40, containerHeight, 0, 100);

    buddySliderWeight.value = w;
    sliders[buddySliderWeight.id].setValue(w);

    buddySliderTall.value = h;
    sliders[buddySliderTall.id].setValue(h);
}
*/

buddyBottomRight.addEventListener("touchstart", function(event) {
    const bounds = buddyResizable.getBoundingClientRect();
    const boundsContainer = buddyContainer.getBoundingClientRect();
    const offsetX =  event.touches[0].clientX - bounds.right + parseInt(buddyResizable.style.right);
    const offsetY = event.touches[0].clientY - bounds.bottom + parseInt(buddyResizable.style.bottom);

    function resizeBuddy(event) {
        let x = bounds.width - (event.touches[0].clientX - bounds.left - offsetX);
        let y = bounds.height - (event.touches[0].clientY - bounds.top - offsetY);

        x = Math.max(buddyMargin, x);
        y = Math.max(buddyMargin, y);

        const top = parseInt(buddyResizable.style.top) + buddyMargin;
        const left = parseInt(buddyResizable.style.left) + buddyMargin;

        x = Math.min(boundsContainer.width - left - buddyMargin, x);
        y = Math.min(boundsContainer.height - top - buddyMargin, y);

        buddyResizable.style.bottom = `${y}px`;
        buddyResizable.style.right = `${x}px`;

        // updateBuddySliders();
    }

    function stopResizeBuddy() {
        document.removeEventListener("touchmove", resizeBuddy);
        document.removeEventListener("touchend", stopResizeBuddy);
    }

    document.addEventListener("touchmove", resizeBuddy);
    document.addEventListener("touchend", stopResizeBuddy);
});

buddyTopLeft.addEventListener("touchstart", function(event) {
    const bounds = buddyResizable.getBoundingClientRect();
    const boundsContainer = buddyContainer.getBoundingClientRect();
    const offsetX =  event.touches[0].clientX - bounds.left - parseInt(buddyResizable.style.left);
    const offsetY = event.touches[0].clientY - bounds.top - parseInt(buddyResizable.style.top);

    function resizeBuddy(event) {
        let x = event.touches[0].clientX - bounds.left - offsetX;
        let y = event.touches[0].clientY - bounds.top - offsetY;

        x = Math.max(buddyMargin, x);
        y = Math.max(buddyMargin, y);

        const bottom = parseInt(buddyResizable.style.bottom) + buddyMargin;
        const right = parseInt(buddyResizable.style.right) + buddyMargin;

        x = Math.min(boundsContainer.width - right - buddyMargin, x);
        y = Math.min(boundsContainer.height - bottom - buddyMargin, y);

        buddyResizable.style.top = `${y}px`;
        buddyResizable.style.left = `${x}px`;

        // updateBuddySliders();
    }

    function stopResizeBuddy() {
        document.removeEventListener("touchmove", resizeBuddy);
        document.removeEventListener("touchend", stopResizeBuddy);
    }

    document.addEventListener("touchmove", resizeBuddy);
    document.addEventListener("touchend", stopResizeBuddy);
});

document.getElementById("question3-suivant").addEventListener("click", function() {
    PAGES.goto("create_avatar_results")
    NETWORK.requestAvatar([]).then((data) => {
        document.getElementById("avatar-preview-text").innerText = "Voici ton avatar !";
        document.getElementById("create-avatar-preview").src = data.url;
        document.getElementById("end-avatar-creation").style.visibility = "visible";
    });
});

PAGES.addCallback("event-countdown", () => {
    UTIL.shownav(true);
});