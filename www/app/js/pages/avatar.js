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

const snapVid = document.getElementById("media-stream");
const snapshotButton = document.getElementById("media-stream-snapshot");
const reloadButton = document.getElementById("media-reload");
const snapImg = document.getElementById("media-snapshot");
let snapState = 0;
let dataURL_media;

function startMediaStream() {
    snapState = 3;
    snapVid.style.display = "block";
    snapImg.style.display = "none";
    reloadButton.style.visibility = "hidden";
    snapshotButton.textContent = "Chargement...";
    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 640 } } })
    .then((stream) => {
        snapVid.srcObject = stream;
        snapVid.play();
        snapshotButton.textContent = "Capturer";
        snapState = 0;
    })
    .catch((err) => {
        console.error(err);
    });
}

function takeSnapshot() {
    switch (snapState) {
        case 0: 
            const canvas = document.createElement("canvas");
            canvas.width = snapVid.videoWidth;
            canvas.height = snapVid.videoHeight;

            canvas.getContext("2d").drawImage(snapVid, 0, 0, canvas.width, canvas.height);
            dataURL_media = canvas.toDataURL("image/png");

            snapImg.src = dataURL_media;
            snapImg.style.display = "block";
            snapVid.style.display = "none";
            snapshotButton.textContent = "Valider"
            reloadButton.style.visibility = "visible";

            snapState=1;
            break;
        case 1:         
            AVATAR_DATA.photo = dataURL_media;
            snapVid.srcObject.getTracks().forEach(track => track.stop());
            PAGES.goto("create_avatar_question1");
            break;
    }
}


snapshotButton.addEventListener("click", function() {
    takeSnapshot();
});

snapVid.addEventListener("click", function() {
    takeSnapshot();
})



reloadButton.addEventListener("click", function() {
    snapVid.srcObject.getTracks().forEach(track => track.stop());
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

var val_anonymity = 0;
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
        val_anonimity = constrain(mapped, 0, 100);
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

// Choose your tribe question
//

let tdata = {
    angle: 0,
    dist: 0
}

const tribeCanvas = document.getElementById("tribe-canvas");
const tribeCtx = tribeCanvas.getContext("2d");
const tribeTriangle = new Image()
tribeTriangle.src = "./img/triangle.png";


const tribes = [
    {
    id: 1,
    name: "Vegetal"
    },
    {
    id: 2,
    name: "Animal"
    },
    {
    id: 3,
    name: "Techno"
    }
]

function drawTriangle() {
    const w = tribeCanvas.width;
    const h = tribeCanvas.height;

    if (tribeTriangle.complete) {
        tribeCtx.drawImage(tribeTriangle, 0, 0, w, h);
    } else {
        tribeCtx.strokeStyle = "white";

        let points = [];
        for (let i = 0; i < 3; i++) {
            const a = Math.PI * 2 / 3 * i;
            const x = Math.sin(a) * w/2 + w/2;
            const y = Math.cos(a) * h/2 + h/2;
            points.push({x, y});
        }

        tribeCtx.beginPath();
        tribeCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 3; i++) {
            tribeCtx.lineTo(points[i].x, points[i].y);
        }
        tribeCtx.lineTo(points[0].x, points[0].y);
        tribeCtx.stroke();
    }

    for (let i = 0; i < 3; i++) {
        const a = Math.PI * 2 / 3 * i;
        const x = Math.sin(a) * w/2 + w/2;
        const y = Math.cos(a) * h/2 + h/2;

        tribeCtx.save();

        tribeCtx.fillStyle = "white";
        tribeCtx.strokeStyle = "#0D0D0D";

        tribeCtx.translate(x, y);
        tribeCtx.rotate(Math.PI - a);
        
        tribeCtx.font = `32px Verdana`
        tribeCtx.textAlign = "center";
        tribeCtx.lineWidth = 6;

        tribeCtx.strokeText(tribes[i].name, 0, 32*2);
        tribeCtx.fillText(tribes[i].name, 0, 32*2);

        tribeCtx.restore();
    }
}

function drawDot() {
    const w = tribeCanvas.width;
    const h = tribeCanvas.height;

    tribeCtx.fillStyle = "white"; 
    const x = Math.sin(tdata.angle) * tdata.dist;
    const y = Math.cos(tdata.angle) * tdata.dist;

    tribeCtx.fillStyle = "white";
    tribeCtx.strokeStyle = "#0D0D0D";
    tribeCtx.lineWidth = 3;
    tribeCtx.beginPath();
    tribeCtx.arc(w/2 + x, h/2 + y, 16, 0, Math.PI * 2);
    tribeCtx.fill();
    tribeCtx.stroke();
}

function handleDotMove(event) {
    const bounds = tribeCanvas.getBoundingClientRect();
    const x = event.touches[0].clientX - bounds.left;
    const y = event.touches[0].clientY - bounds.top;

    tdata.angle = Math.atan2(x - tribeCanvas.width/2, y - tribeCanvas.height/2);
    let dist = distance(x, y, tribeCanvas.width/2, tribeCanvas.height/2);

    const a = tdata.angle % (Math.PI * 2 / 3);
      
    const mappedmax = (-Math.abs(Math.sin(a*1.5)) / 2 + 1) * tribeCanvas.width / 2;
    
    // (Math.abs(Math.sin(a*1.5)) / 2 + 1) * tribeCanvas.width/Math.PI;

    tdata.dist = constrain(dist, 0, mappedmax) 

    tribeCtx.clearRect(0, 0, tribeCanvas.width, tribeCanvas.height);
    drawTriangle();
    drawDot();
}

tribeCanvas.addEventListener("touchstart", function(event) {
    handleDotMove(event);
})

tribeCanvas.addEventListener("touchmove", function(event) {
    handleDotMove(event);
})

let val_tribute = 0
tribeCanvas.addEventListener("touchend", function(event) {
    const val = Math.round((tdata.angle / Math.PI + 1/3) * 1.5 + 0.5 + 2) % 3;
    val_tribute = Math.abs(val);
    // console.log(val_tribute)
})

PAGES.addCallback("create_avatar_question2", function() {
    tribeCanvas.width = tribeCanvas.offsetWidth;
    tribeCanvas.height = tribeCanvas.offsetHeight;

    drawTriangle();
    drawDot();
})

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

document.getElementById("question3-suivant").addEventListener("click", function() 
{
    PAGES.goto("create_avatar_results")
    document.getElementById("avatar-preview-text").innerText = "Ton avatar est en cours de création...";
    document.getElementById("create-avatar-preview").innerHTML = "";
    
    NETWORK.query('Avatar.generate', userData.uuid ,
        {
            pic: AVATAR_DATA.photo,
            anonymity: val_anonymity,
            tribe: tribes[val_tribute].name
        })
        .then((data) => { 
            PAGES.goto("create_avatar_processing") 
        }); // TODO: don't go directly to results since generation is in queue ! Thus data is empty for now..
});

PAGES.selectAvatar = function(avatars) {
    
    document.getElementById("avatar-preview-text").innerText = "Choisis ton avatar favori";
    document.getElementById("create-avatar-preview").innerHTML = "";

    let lock = false;
    for (let i = 0; i < avatars.length; i++) {
        const img = document.createElement("img");
        img.src = avatars[i].url;
        document.getElementById("create-avatar-preview").appendChild(img);
        img.addEventListener("click", ()=> {
            if (lock) return;
            lock = true;
            NETWORK.query("Avatar.select", userData.uuid, avatars[i].id)
                        .then( () => { NETWORK.loadUser(); });
        })
    }

    PAGES.goto("create_avatar_results")
}

renderer.addElement(document.querySelector("#mon-avatar-container>img"))
PAGES.addCallback("mon_avatar", () => {
    document.querySelector("#mon-avatar-container>img").src = userData.selected_avatar.url
});

const container_avatar = document.getElementById("mon-avatar-container");
const container_changeavatar = document.getElementById("change-avatar-container");

document.getElementById("change-avatar").addEventListener("click", () => {

    document.querySelector("#btn-regenerate-avatar").style.display = "block";
    document.querySelector("#btn-delete-user").style.display = "none";

    container_avatar.style.display = "none";

    container_changeavatar.innerHTML = "";
    container_changeavatar.style.display = "grid";

    userData.avatars.forEach((avatar) => {
        const img = document.createElement("img");
        img.src = avatar.url;
        container_changeavatar.appendChild(img);
        img.addEventListener("click", ()=> {
            NETWORK.query("Avatar.select", userData.uuid, avatar.id).then(() => {
                userData.selected_avatar = avatar
                document.querySelector("#mon-avatar-container>img").src = avatar.url;

                container_changeavatar.style.display = "none";

                document.querySelector("#btn-regenerate-avatar").style.display = "none";
                document.querySelector("#btn-delete-user").style.display = "block";

                container_avatar.style.display = "block";
            });
        })
    });
})

document.getElementById("btn-regenerate-avatar").addEventListener("click", () => {
    PAGES.goto("create_avatar_photo");
})