// Record microphone audio from a button
//

const record = document.getElementById("recorder-btn");
const recordbar = document.getElementById("recorder-bar");
const recordMaxTime = 5;
const record_status = ["Enregistrer un cri", "Arrêter l'enregistrement"];
let mediaRecorder;
let isRecording = false;

record.addEventListener("click", async function() {
    if (isRecording) {
        isRecording = false;
        record.innerText = record_status[0];
        await stopRecording();
    } else {
        isRecording = true;
        record.innerText = record_status[1];
        await startRecording();
    }
});

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
    });

    const playaudio = () => {
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    }

    let startTime = Date.now();
    let intervalId;

    intervalId = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progress = (elapsedTime / (recordMaxTime * 1000)) * 100;
        recordbar.querySelector("div").style.width = `${progress}%`;

        if (progress >= 100) {
            clearInterval(intervalId);
        }
    }, 10);

    setTimeout(() => {
        if (isRecording) {
            isRecording = false;
            record.innerText = record_status[0];
            stopRecording();
        }
    }, recordMaxTime * 1000);

    mediaRecorder.addEventListener("stop", async () => {
        playaudio();
        clearInterval(intervalId);
        recordbar.querySelector("div").style.width = `0%`;
    });

    mediaRecorder.start();
}

async function stopRecording() {
    mediaRecorder.stop();
}

// Take a picture from the camera
//

const vid = document.getElementById("media-stream");
const snapshotButton = document.getElementById("media-stream-snapshot");
const reloadButton = document.getElementById("media-reload");
let snapState = 0;
let dataURL_media;

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

// startMediaStream();

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
            console.log(dataURL_media); 
            vid.srcObject.getTracks().forEach(track => track.stop());
            break;
    }
});

reloadButton.addEventListener("click", function() {
    vid.srcObject.getTracks().forEach(track => track.stop());
    startMediaStream();
});

// Select image between an array of 4 images
//

const imgArray = document.getElementById("image-array")

function selectImage(id) {
    console.log(id);
}

function receiveImages(arr) {
    for (let i = 0; i < arr.length; i++) {
        const img = document.createElement("img");
        img.src = arr[i];
        imgArray.appendChild(img);

        img.addEventListener("click", function() {
            selectImage(i);
            imgArray.querySelectorAll("img").forEach((img) => img.style.border = "none");
            img.style.border = "1px solid blue";
        });
    }
}

document.getElementById("image-getbutton").addEventListener("click", function() {
    const imgArr = [
        "https://via.placeholder.com/150",
        "https://via.placeholder.com/150",
        "https://via.placeholder.com/150",
        "https://via.placeholder.com/150"
    ];
    receiveImages(imgArr);
});

// Activate color overlay 

OVERLAY = {
    dom: document.getElementById("OVERLAY"),
    enable: function(color, text) {
        this.dom.style.display = "flex";
        this.dom.style.backgroundColor = color;
        this.dom.innerHTML = text;
    },
    disable: function() {
        this.dom.innerHTML = "";
        this.dom.style.backgroundColor = "transparent";
        this.dom.style.display = "none";
    }
};

const overlayArray = document.getElementById("overlay-array");

function receiveColors(arr) {
    for (let i = 0; i < arr.length; i++) {
        const color = arr[i];
        const div = document.createElement("div");
        div.style.backgroundColor = color;
        div.style.width = "50px";
        div.style.height = "50px";
        div.style.border = "1px solid black";
        div.style.margin = "5px";
        div.style.cursor = "pointer";
        div.addEventListener("click", function() {
            OVERLAY.enable(color, "");
        });
        overlayArray.appendChild(div);
    }
}

function receiveText(textArr) {
    for (let i = 0; i < textArr.length; i++) {
        const text = textArr[i];
        const div = document.createElement("div");
        div.textContent = text;
        div.style.width = "50px";
        div.style.height = "50px";
        div.style.border = "1px solid black";
        div.style.margin = "5px";
        div.style.cursor = "pointer";
        div.addEventListener("click", function() {
            OVERLAY.enable("black", text);
        });
        overlayArray.appendChild(div);
    }
}

const colorArr = [
    "red",
    "green",
    "blue",
    "yellow"
];

// receiveColors(colorArr);

// receiveText(["Text 1", "Text 2", "Text 3", "Text 4"]);

// Flashlight management
//

const FLASHLIGHT = {
    track: null,
    init: function() {
        FLASHLIGHT.init = function() {
            const SUPPORTS_MEDIA_DEVICES = 'mediaDevices' in navigator;

            if (SUPPORTS_MEDIA_DEVICES) {
                // Get the environment camera (usually the second one)
                navigator.mediaDevices.enumerateDevices().then(devices => {
                    const cameras = devices.filter((device) => device.kind === 'videoinput');

                    if (cameras.length === 0) {
                        throw 'No camera found on this device.';
                    }
                    const camera = cameras[cameras.length - 1];

                    // Create stream and get video track
                    navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: camera.deviceId,
                            facingMode: ['user', 'environment'],
                            height: { ideal: 1080 },
                            width: { ideal: 1920 }
                        }
                    }).then(stream => {
                        const track = stream.getVideoTracks()[0];

                        // Create image capture object and get camera capabilities
                        const imageCapture = new ImageCapture(track)
                        const photoCapabilities = imageCapture.getPhotoCapabilities().then(() => {
                            FLASHLIGHT.track = track;
                        });
                    }).catch(error => {
                        console.error('Error starting video input:', error);
                    });
                });

                // The light will be on as long the track exists
            }
        };
    },
    flash: function(state) {
        if (FLASHLIGHT.track) {
            FLASHLIGHT.track.applyConstraints({
                advanced: [{ torch: state }]
            });
        } else {
            FLASHLIGHT.init();
        }
    }
}

document.addEventListener("click", function() {
    FLASHLIGHT.flash(true);    
});

// Socket.io
//

socket.on("start-event", function(data) {
    switch (data.name) {
        case "color":
            receiveColors(data.args)
            break;
        case "text":
            receiveText(data.args)
            break;
    }
});

socket.on("end-event", function() {
    overlayArray.innerHTML = "";
    OVERLAY.disable();
});
