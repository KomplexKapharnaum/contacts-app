/*========== Pseudonyme ==========*/

const formPseudoInput = document.getElementById('pseudo-input');
const formPseudoSubmit = document.getElementById('pseudo-submit');

formPseudoSubmit.addEventListener('click', function() {
    if (!formPseudoInput.value) return UTIL.alert("Veuillez entrer un pseudonyme");
    USER.setName(formPseudoInput.value);
    PAGES.goto("photo");
});

PAGES.addCallback("pseudo", () => {
    DRAW_BACKGROUND = false;
});

/*========== Photo media stream ==========*/

const vid = document.getElementById("media-stream");

function startMediaStream() {
    snapState = 3;
    reloadButton.style.visibility = "hidden";
    snapshotButton.textContent = "Chargement...";
    navigator.mediaDevices.getUserMedia({ video: true })
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
            USER.setSelfie(dataURL_media);
            PAGES.goto("anon");
            vid.srcObject.getTracks().forEach(track => track.stop());
            break;
    }
});

reloadButton.addEventListener("click", function() {
    vid.srcObject.getTracks().forEach(track => track.stop());
    startMediaStream();
});

PAGES.addCallback("photo", startMediaStream);

/*========== Anonimity ==========*/

const anonymityContainer = document.getElementById("anonymity-container");
const anonymityMask = document.getElementById("anonymity-mask");
const anonymitySlider = document.getElementById("anonymity-slider");

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
        anonymitySlider.value = clamped;
        sliders[anonymitySlider.id].setValue(clamped);
    }

    function stopMovingAnonymityMask() {
        document.removeEventListener("touchmove", moveAnonymityMask);
        document.removeEventListener("touchend", stopMovingAnonymityMask);
    }

    document.addEventListener("touchmove", moveAnonymityMask);
    document.addEventListener("touchend", stopMovingAnonymityMask);
});

document.getElementById("anonymity-submit").addEventListener("click", function() {
    USER.addPrompt("anonimity", anonymitySlider.value);
    PAGES.goto("poids_taille");
});

/*========== Poids et taille ==========*/


const buddyContainer = document.getElementById("tallfat-container");
const buddyResizable = document.getElementById("tallfat-buddy");
const buddyTopLeft = document.getElementById("resize-topleft");
const buddyBottomRight = document.getElementById("resize-bottomright");
const buddySliderWeight = document.getElementById("tallfat-slider-weight");
const buddySliderTall = document.getElementById("tallfat-slider-tall");

const buddyMargin = 16;

function initBuddy() {
    buddyResizable.style.top = buddyMargin+"px";
    buddyResizable.style.left = buddyMargin+"px";
    buddyResizable.style.right = buddyMargin+"px";
    buddyResizable.style.bottom = buddyMargin+"px";
    updateBuddySliders();
}
initBuddy();

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

        updateBuddySliders();
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

        updateBuddySliders();
    }

    function stopResizeBuddy() {
        document.removeEventListener("touchmove", resizeBuddy);
        document.removeEventListener("touchend", stopResizeBuddy);
    }

    document.addEventListener("touchmove", resizeBuddy);
    document.addEventListener("touchend", stopResizeBuddy);
});

document.getElementById("tallfat-submit").addEventListener("click", function() {
    USER.addPrompt("height", buddySliderTall.value);
    USER.addPrompt("width", buddySliderWeight.value);
    PAGES.goto("nature");
});

/*========== Nature ==========*/

const plantSlider = document.getElementById("slider-forest");
const replantButton = document.getElementById("replant-button");

const plantAmount = 6;

let plantData = {
    max: 30,
    default: 15,
    current: 15
}

function updatePlantCount() {
    plantSlider.max = plantData.max;
    sliders[plantSlider.id].max = plantData.max;
    plantSlider.value = plantData.current;
    sliders[plantSlider.id].setValue(plantData.current);
}

function createPlant(count) {
    for (let i=0 ; i<count ; i++) {
        const plant = document.createElement("div");

        plant.classList.add("plant");
        
        plant.style.backgroundImage = `url(./assets/flowers/${Math.floor(Math.random() * plantAmount)}.png)`;
        
        // plant.textContent = trees[Math.floor(Math.random() * trees.length)];

        plant.style.left = `${Math.random() * 100}%`;
        plant.style.top = `${Math.random() * 100}%`;

        document.getElementById("nature-container").appendChild(plant);

        plant.addEventListener("click", function() {
            plant.remove();
            plantData.current--;
            updatePlantCount();
        });
    }
}

createPlant(plantData.default);
updatePlantCount();

replantButton.addEventListener("click", function() {
    if (plantData.current < plantData.max) { 
        createPlant(1)
        plantData.current++;
        updatePlantCount();
    }
});

document.getElementById("nature-submit").addEventListener("click", function() {
    USER.addPrompt("nature", plantData.current);
    PAGES.goto("respect_regles");
});

/*========== Respect des règles ==========*/

const reglesRode = document.querySelector(".rode")
const regleSocle = document.querySelector(".socle")
const regleBal_left = document.querySelector(".bal1")
const regleBal_right = document.querySelector(".bal2")
const regleSlider = document.getElementById("respect-regles-slider");

function setBalAngle(ang) {
    currentAngle = ang;
    reglesRode.style.transform = `translateX(-50%) rotate(${ang}deg)`
    regleBal_left.style.transform = `translateX(-50%) rotate(${-ang}deg)`
    regleBal_right.style.transform = `translateX(50%) rotate(${-ang}deg)`

    regleSlider.value = map(ang, -40, 40, 0, 100);
    sliders[regleSlider.id].setValue(regleSlider.value);
}

let currentAngle = 0;
setBalAngle(currentAngle);

function moveBalance(mult, event) {
    let yCenter = regleSocle.getBoundingClientRect().top;
    let y = event.touches[0].clientY;

    let a = y - yCenter;
    let h = regleSocle.getBoundingClientRect().width / 2;

    let ang = Math.asin(a / h) * 180 / Math.PI;
    ang = Math.max(-40, Math.min(ang, 40));

    if (isNaN(ang)) return;

    setBalAngle(ang * mult);
}

regleBal_right.addEventListener("touchmove", function(event) {
    moveBalance(1, event);
});

regleBal_left.addEventListener("touchmove", function(event) {
    moveBalance(-1, event);
});

document.getElementById("respect-regles-submit").addEventListener("click", function() {
    USER.addPrompt("respect", regleSlider.value);
    PAGES.goto("choix_hybride");
});

/*========== Choix de l'hybride ==========*/

const hybrideVegetal = document.getElementById("hybride-vegetal");
const hybrideAnimal = document.getElementById("hybride-animal");

hybrideVegetal.addEventListener("click", function() {
    USER.addPrompt("hybride", "vegetal");
    PAGES.goto("paranoia"); // Route vegetal
});

hybrideAnimal.addEventListener("click", function() {
    USER.addPrompt("hybride", "animal");
    PAGES.goto("violence"); // Route animal
});

/*========== Paranoïa ==========*/

const paranoDoor = document.getElementById("parano-door");
const paranoSlider = document.getElementById("parano-slider");

function createCadenasses(count) {
    for (let i=0 ; i<count ; i++) {
        const cadenas = document.createElement("div");

        cadenas.classList.add("parano-lock");
        cadenas.classList.add("locked");

        cadenas.addEventListener("click", function() {
            cadenas.classList.toggle("locked");
            if (cadenas.classList.contains("locked")) {
                cadenas.classList.add("locked");
            } else {
                cadenas.classList.remove("locked");
            }
            
            let lockedCount = 0;
            document.querySelectorAll(".parano-lock").forEach(lock => {
                if (!lock.classList.contains("locked")) {
                    lockedCount++;
                }
            });

            paranoSlider.value = map(lockedCount, 0, count, 0, 100);
            sliders[paranoSlider.id].setValue(paranoSlider.value);

        });

        document.getElementById("parano-lockers").appendChild(cadenas);
    }
}

createCadenasses(6);

document.getElementById("parano-submit").addEventListener("click", function() {
    USER.addPrompt("paranoia", paranoSlider.value);
    PAGES.random("visage", "scarifications", "pilosite")
});

/*========== Parties du visage ==========*/

const pathBodyParts = "./assets/face_parts_mask.svg";
fetch(pathBodyParts)
.then(response => response.text())
.then(svg => {
    document.getElementById("head-container").innerHTML += svg;
    let parts = document.querySelectorAll(".bodypart");
    parts.forEach(part => {
        part.addEventListener("click", function() {
            part.classList.toggle("unselected");
        });
    })
});

document.getElementById("visage-submit").addEventListener("click", function() {
    const selectedParts = document.querySelectorAll(".bodypart.unselected");
    let parts = [];
    selectedParts.forEach(part => {
        parts.push(part.dataset.name);
    });

    USER.addPrompt("remove-face-parts", parts);
    PAGES.goto("submit");
});

/*========== Scarifications ==========*/

const pathBodySurgery = "./assets/body-full-hitbox.svg";
let surgeryCount = 0;

fetch(pathBodySurgery)
.then(response => response.text())
.then(svg => {
    document.getElementById("surgery-body").innerHTML += svg;
    document.querySelector("#surgery-body-container path").addEventListener("click", function(event) {
        const surgeriesContainer = document.querySelector("#surgery-body");
        let bounds = surgeriesContainer.getBoundingClientRect();
        let scalpel = document.createElement("div");

        scalpel.classList.add("scalpel");
        scalpel.style.left = `${event.clientX - bounds.left}px`;
        scalpel.style.top = `${event.clientY - bounds.top}px`;

        surgeriesContainer.appendChild(scalpel);

        scalpel.addEventListener("click", function() {
            scalpel.remove();
            surgeryCount--;
        });
        surgeryCount++;
    });
});

document.getElementById("scarifications-submit").addEventListener("click", function() {
    USER.addPrompt("scarifications", surgeryCount);
    PAGES.goto("submit");
});

/*========== Pilosité ==========*/

const furSlider = document.getElementById("slider-fur");
const furCanvas = document.getElementById("cnv-fur");
const furCtx = furCanvas.getContext("2d");

furSlider.addEventListener("input", function() {
    furCtx.clearRect(0, 0, furCanvas.width, furCanvas.height);
    furCtx.lineWidth = 1.5;
    furCtx.strokeStyle = "black";
    const val = furSlider.value;
    for (let i = 0; i < val * 4; i++) {
        const rx = Math.random() * furCanvas.width;
        const ry = Math.random() * furCanvas.height;
        const rm = Math.random() * 8 - 4;

        furCtx.beginPath();
        furCtx.moveTo(rx, ry);
        furCtx.lineTo(rx + rm, ry + 35);
        furCtx.stroke();
    }
});

document.getElementById("pilosite-submit").addEventListener("click", function() {
    USER.addPrompt("pilosite", parseInt(furSlider.value) / 10);
    PAGES.goto("submit");
});

PAGES.addCallback("pilosite", () => {
    furCanvas.width = furCanvas.parentElement.offsetWidth;
    furCanvas.height = furCanvas.parentElement.offsetHeight;
});

/*========== Violence ==========*/

const sportButton = document.getElementById("sport-button");
const sportSubmit = document.getElementById("violence-submit");
let sportCount = 0;
let sportState = 0;

function sportReset() {
    sportButton.innerHTML = "Martelez 10 secondes<br>pour calculer votre score !";
    sportCount = 0;
    sportState = 0;
}
sportReset();

sportButton.addEventListener("click", function() {
    switch (sportState) {
        case 0:
            sportSubmit.disabled = true;
            sportState = 1;
            sportButton.textContent = "Martelez !";
            setTimeout(() => {
                sportState = 2;
                let averagePerSecond = sportCount / 10;
                sportButton.textContent = "Ton score : " + Math.floor(averagePerSecond) + " coups par seconde";
                sportSubmit.disabled = false;
                setTimeout(() => {
                    sportReset();
                }, 5000);
            }, 10000);
            break;
        case 1:

            sportButton.style.backgroundImage = "url(./assets/duck_donk.png)";
            setTimeout(() => {
                sportButton.style.backgroundImage = "";
            }, 70);

            sportCount++;
            break;
    }
});

document.getElementById("violence-submit").addEventListener("click", function() {
    USER.addPrompt("violence", sportCount);
    PAGES.random("intellect", "viande", "drogue")
});

/*========== Intellect ==========*/


/*========== Viande ==========*/

const cowCanvas = document.getElementById("cow-canvas");
const cowToMask = document.getElementById("cow-to-mask");
const cowCtx = cowCanvas.getContext("2d");
const cowSlider = document.getElementById("viande-slider");

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
        // cowCtx.drawImage(cowToMask, 0, 0, cowCanvas.width, cowCanvas.height);
        cowCtx.globalCompositeOperation = "destination-out";
    cowCtx.stroke();
    
    cowCtx.globalCompositeOperation = "source-over";
     

    cowData.current = getOpaquePixels();

    cowSlider.value = map(cowData.current, cowData.default, 0, 0, 100);
    sliders[cowSlider.id].setValue(cowSlider.value);

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
    cowSlider.value = 0;
    sliders[cowSlider.id].setValue(0);
});

PAGES.addCallback("viande", () => {
    cowCanvas.width = cowCanvas.offsetWidth;
    cowCanvas.height = cowCanvas.offsetHeight;

    cowToMask.onload = function() {
        cowCtx.drawImage(cowToMask, 0, 0, cowCanvas.width, cowCanvas.height);
        cowData.default = getOpaquePixels();
    }

    cowToMask.src = "./assets/cow.png";
});

document.getElementById("viande-submit").addEventListener("click", function() {
    USER.addPrompt("viande", cowSlider.value);
    PAGES.goto("submit");
});

/*========== Drogue ==========*/

let seringeData;

let isSeringeInPlace = false;

const seringe = document.getElementById("drug-seringe");
const seringeContainer = document.getElementById("drug-container");
const drugPupil = document.getElementById("drug-pupil");

seringe.addEventListener("touchstart", function(event) {
    const bounds = seringe.getBoundingClientRect();
    const offsetX = event.touches[0].clientX - bounds.left;
    const offsetY = event.touches[0].clientY - bounds.top;

    function moveSeringe(event) {
        const sbounds = seringeContainer.getBoundingClientRect();
        let x = event.touches[0].clientX - offsetX - sbounds.left;
        let y = event.touches[0].clientY - offsetY - sbounds.top;

        x = Math.max(seringeData.leftMin, Math.min(seringeData.leftMax, x));
        y = Math.max(seringeData.topMin, Math.min(seringeData.topMax, y));

        seringe.style.left = `${x}px`;
        seringe.style.top = `${y}px`;

        isSeringeInPlace = (x == seringeData.leftMin);
    }

    function stopMovingSeringe() {
        document.removeEventListener("touchmove", moveSeringe);
        document.removeEventListener("touchend", stopMovingSeringe);
    }

    document.addEventListener("touchmove", moveSeringe);
    document.addEventListener("touchend", stopMovingSeringe);
});

let pupilAmount = 1;
setInterval(() => {
    if (isSeringeInPlace) {
        pupilAmount+=0.01;
        pupilAmount = Math.min(2.5, pupilAmount);

        document.getElementById("drug-slider").value = map(pupilAmount, 1, 2.5, 0, 100);
        sliders["drug-slider"].setValue(map(pupilAmount, 1, 2.5, 0, 100));

    }
    drugPupil.style.transform = `scale(${pupilAmount})`;
}, 10);

document.getElementById("drug-reset").addEventListener("click", function() {
    pupilAmount = 1;
    drugPupil.style.transform = `scale(${pupilAmount})`;

    document.getElementById("drug-slider").value = 0;
    sliders["drug-slider"].setValue(0);
});

PAGES.addCallback("drogue", () => {
    seringeData = {
        topMin: 130,
        topMax: 220,
        leftMin: 75,
        leftMax: seringeContainer.offsetWidth - 130
    }
});

document.getElementById("drug-submit").addEventListener("click", function() {
    USER.addPrompt("conso drogue", map(pupilAmount, 1, 2.5, 0, 100));
    PAGES.goto("submit");
});

/*========== Pump Intelligence ==========*/

const pumpHandle = document.getElementById("pump-handle");
const brain = document.getElementById("brain");
const brainContainer = document.getElementById("brain-container");
const brainSlider = document.getElementById("intellect-slider");

let pumpPrevY = 0;
let brainSize = 16;

function updateBrain() {
    let w = Math.min(brainContainer.offsetWidth, brainContainer.offsetHeight, brainSize);
    brainSize = w;
    brain.style.width = `${brainSize}px`;

    let val = map(brainSize, 16, Math.min(brainContainer.offsetWidth, brainContainer.offsetHeight), 0, 100);
    brainSlider.value = val;
    sliders[brainSlider.id].setValue(val);
}

pumpHandle.addEventListener("touchmove", function(event) {
    const bounds = pumpHandle.parentElement.getBoundingClientRect();
    let y = event.touches[0].clientY - bounds.top;
    y = Math.max(0, Math.min(60, y));
    pumpHandle.style.top = `${y}px`;

    if (pumpPrevY < y) {
        brainSize += (y - pumpPrevY) / 60 * 10;
        // console.log(brainSize)
        updateBrain();
    }

    pumpPrevY = y;
});

document.getElementById("intellect-reset").addEventListener("click", function() {
    brainSize = 16;
    updateBrain();
});

PAGES.addCallback("intellect", () => {
    updateBrain();
});

document.getElementById("intellect-submit").addEventListener("click", function() {
    USER.addPrompt("intellect", brainSlider.value);
    PAGES.goto("submit");
});