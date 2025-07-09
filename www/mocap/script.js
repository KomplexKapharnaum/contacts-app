// Configuration
const CONFIG = {
    FRAME_RATE_LIMIT: 30, // Target FPS for mini canvas
    MAX_WIDTH: window.innerWidth, // Maximum preview width: viewport width
    MAX_HEIGHT: window.innerHeight, // Maximum preview height: viewport height
    DEFAULT_MINI_WIDTH: 512
};

const FLAGS = {
    head: 0,
    hands: 0,
    body: 0
}

const lerp = (a, b, t) => a + (b - a) * t;

FLAGS.hands = 2

// setInterval(() => {
//     FLAGS.head = Math.floor(Math.random() * 4);
//     FLAGS.hands = Math.floor(Math.random() * 3);
// }, 5000);

const POSECOLORS = [
    '255,0,0', // red
    '0,255,0', // green
    '0,0,255', // blue 
    '255,255,0', // yellow
    '255,0,255', // magenta
    '0,255,255', // cyan
    '255,128,0', // orange
    '128,0,255', // purple 
    '0,128,255', // light blue
    '128,255,0', // lime
    '255,0,128', // pink
]

// Initialize Handsfree.js with optimized settings (using our video element)
const handsfree = new Handsfree({
    showDebug: false,
    hands: {
        enabled: true,
        gesture: false,
        minDetectionConfidence: 0.6
    },
    pose: {
        enabled: true,
        smoothLandmarks: true,
        minDetectionConfidence: 0.4,
        minTrackingConfidence: 0.7
    },
    facemesh: {
        enabled: false,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    },
    setup: {
        video: {
            $el: document.getElementById('preview')
        }
    }
});

// DOM elements
const preview = document.getElementById('preview');
const mainCanvas = document.getElementById('canvas');
const ctx = mainCanvas.getContext('2d');
const miniCanvas = document.getElementById('mini-canvas');
const miniCtx = miniCanvas.getContext('2d');

// Canvas dimensions will be set based on video dimensions
let canvasWidth = CONFIG.MAX_WIDTH;
let canvasHeight = CONFIG.MAX_HEIGHT;

// Camera switching variables
let currentStream = null;
// Determine initial facing mode from URL parameter 'cam'
const camParam = new URLSearchParams(window.location.search).get('cam');
const currentFacingMode = camParam === 'environment' ? 'environment' : 'user';
// Stream switching will reload the page instead of dynamic update
// let isInitialized = false;

// URL parameters for mini canvas sizing
const urlParams = new URLSearchParams(window.location.search);
const hasCustomSize = urlParams.has('w') || urlParams.has('h');

if (hasCustomSize) {
    const specifiedWidth = urlParams.has('w') ? parseInt(urlParams.get('w'), 10) : null;
    const specifiedHeight = urlParams.has('h') ? parseInt(urlParams.get('h'), 10) : null;

    if (specifiedWidth && specifiedHeight) {
        // Both w and h specified - use exact dimensions (may deform 1:2 ratio)
        miniCanvas.width = specifiedWidth;
        miniCanvas.height = specifiedHeight;
    } else if (specifiedWidth) {
        // Only width specified - calculate height for 1:2 ratio
        miniCanvas.width = specifiedWidth;
        miniCanvas.height = specifiedWidth * 2;
    } else if (specifiedHeight) {
        // Only height specified - calculate width for 1:2 ratio
        miniCanvas.height = specifiedHeight;
        miniCanvas.width = specifiedHeight / 2;
    }
} else {
    // Default sizing
    miniCanvas.width = CONFIG.DEFAULT_MINI_WIDTH;
    miniCanvas.height = miniCanvas.width * 2;
}

// Show/hide elements based on configuration
if (!hasCustomSize) {
    miniCanvas.style.display = 'none';
} else {
    preview.style.display = 'none';
    mainCanvas.style.display = 'none';
    const h3 = document.querySelector('h3');
    if (h3) h3.style.display = 'none';
}

// Pre-calculate crop dimensions for main canvas
let mainWidth, mainHeight, cropHeight, cropWidth, sx, sy;

// Video crop dimensions (calculated once video loads)
let videoCropData = null;

// Frame rate limiting for mini canvas
let lastMiniCanvasUpdate = 0;
const miniCanvasInterval = 1000 / CONFIG.FRAME_RATE_LIMIT;

// Initialize webcam first
navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: currentFacingMode
    }
}).then(stream => {
    currentStream = stream; // save stream for switching
    preview.srcObject = stream;
    // Detect if multiple cameras available to show switch button
    let showSwitch = false;
    const track = stream.getVideoTracks()[0];
    if (track.getCapabilities) {
        const caps = track.getCapabilities();
        if (caps.facingMode && caps.facingMode.length > 1) {
            showSwitch = true;
        }
    }
    if (!showSwitch && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const inputs = devices.filter(d => d.kind === 'videoinput');
            if (inputs.length > 1) showSwitch = true;
            switchButton.style.display = showSwitch ? 'block' : 'none';
        }).catch(err => console.error('Device enumeration error:', err));
    } else {
        switchButton.style.display = showSwitch ? 'block' : 'none';
    }
});

// Calculate dimensions and start Handsfree.js once video metadata is loaded
preview.addEventListener('loadedmetadata', () => {

    const videoWidth = preview.videoWidth;
    const videoHeight = preview.videoHeight;

    // Calculate display dimensions that fit within max bounds while maintaining aspect ratio
    let displayWidth = videoWidth;
    let displayHeight = videoHeight;

    if (displayWidth > CONFIG.MAX_WIDTH) {
        displayWidth = CONFIG.MAX_WIDTH;
        displayHeight = (videoHeight * CONFIG.MAX_WIDTH) / videoWidth;
    }

    if (displayHeight > CONFIG.MAX_HEIGHT) {
        displayHeight = CONFIG.MAX_HEIGHT;
        displayWidth = (videoWidth * CONFIG.MAX_HEIGHT) / videoHeight;
    }

    // Set canvas dimensions to match display dimensions
    canvasWidth = displayWidth;
    canvasHeight = displayHeight;
    mainCanvas.width = canvasWidth;
    mainCanvas.height = canvasHeight;

    // Update preview and canvas size
    preview.style.width = `${displayWidth}px`;
    preview.style.height = `${displayHeight}px`;
    mainCanvas.style.width = `${displayWidth}px`;
    mainCanvas.style.height = `${displayHeight}px`;

    // Update container size
    const container = document.getElementById('container');
    container.style.width = `${displayWidth}px`;
    container.style.height = `${displayHeight}px`;

    // Pre-calculate crop dimensions for main canvas
    updateCropDimensions()

    // Calculate video crop dimensions for mini canvas
    let VcropHeight = videoHeight;
    let VcropWidth = VcropHeight / 2;
    if (VcropWidth > videoWidth) {
        VcropWidth = videoWidth;
        VcropHeight = VcropWidth * 2;
    }
    videoCropData = {
        width: VcropWidth,
        height: VcropHeight,
        x: (videoWidth - VcropWidth) / 2,
        y: (videoHeight - VcropHeight) / 2
    };

    // Apply mirroring transform
    // const mirrorTransform = 'scaleX(-1)';
    // preview.style.transform = mirrorTransform;
    // mainCanvas.style.transform = mirrorTransform;
    // miniCanvas.style.transform = mirrorTransform;

    // Start Handsfree.js after video is ready
    handsfree.start();

    if (!hasCustomSize && preview.videoWidth && preview.videoHeight) {
        resizeToFitViewport();
    }
});

function updateCropDimensions() {
    mainWidth = canvasWidth;
    mainHeight = canvasHeight;
    mainHeight = canvasHeight;
    mainHeight = canvasHeight;
    cropHeight = mainHeight;
    cropWidth = cropHeight / 2;
    if (cropWidth > mainWidth) {
        cropWidth = mainWidth;
        cropHeight = cropWidth * 2;
    }
    sx = (mainWidth - cropWidth) / 2;
    sy = (mainHeight - cropHeight) / 2;
}

window.addEventListener('resize', () => {
    if (!hasCustomSize && preview.videoWidth && preview.videoHeight) {
        resizeToFitViewport();
    }
});

// 
// VIEWPORT
//

function resizeToFitViewport() {
    const videoWidth = preview.videoWidth;
    const videoHeight = preview.videoHeight;
    const aspectRatio = videoWidth / videoHeight;

    // Use clientWidth/clientHeight for more accurate viewport size
    let displayWidth = document.documentElement.clientWidth;
    let displayHeight = document.documentElement.clientHeight;

    if (displayWidth / displayHeight > aspectRatio) {
        displayHeight = document.documentElement.clientHeight;
        displayWidth = displayHeight * aspectRatio;
    } else {
        displayWidth = document.documentElement.clientWidth;
        displayHeight = displayWidth / aspectRatio;
    }

    canvasWidth = displayWidth;
    canvasHeight = displayHeight;
    mainCanvas.width = canvasWidth;
    mainCanvas.height = canvasHeight;
    preview.style.width = `${displayWidth}px`;
    preview.style.height = `${displayHeight}px`;
    mainCanvas.style.width = `${displayWidth}px`;
    mainCanvas.style.height = `${displayHeight}px`;

    const container = document.getElementById('container');
    container.style.width = `${displayWidth}px`;
    container.style.height = `${displayHeight}px`;
}

//
// DRAW
//

// Define hand connections (MediaPipe Hands format)
const HAND_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [2, 5], // Thumb
    [5, 6],
    [6, 7],
    [7, 8], // Index
    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Middle
    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Ring
    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Pinky
    [0, 17] // Palm base to pinky base
];

// Define pose connections (MediaPipe Pose format)
const POSE_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [1, 3],
    [0, 4], 
    [4, 6],
    [3, 7], 
    [6, 8], 
    [9, 10],

    // [1, 3], // Left eye to left ear
    // [2, 4], // Right eye to right ear
    // [0, 5], // Nose to left shoulder
    // [0, 6], // Nose to right shoulder
    // [5, 7], // Left shoulder to left elbow
    // [7, 9], // Left elbow to left wrist
    // [6, 8], // Right shoulder to right elbow
    // [8, 10], // Right elbow to right wrist

    [11, 12], // Shoulders
    [11, 13],
    [13, 15], // Left arm
    [12, 14],
    [14, 16], // Right arm
    [11, 23],
    [12, 24], // Shoulders to hips
    [23, 24], // Hips
    [24, 26],
    [26, 28], // Right leg
    [23, 25],
    [25, 27], // Left leg
    [27, 29],
    [29, 31],
    [27, 31], // Left foot
    [28, 30],
    [30, 32],
    [28, 32] // Right foot
];

// Optimized mini canvas drawing with frame rate limiting
function drawMiniCanvas() {
    const now = Date.now();
    if (now - lastMiniCanvasUpdate < miniCanvasInterval) {
        return; // Skip this frame
    }
    lastMiniCanvasUpdate = now;

    if (!videoCropData) return; // Wait for video metadata

    miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);

    // Draw video background
    miniCtx.globalAlpha = 0.3;
    miniCtx.drawImage(
        preview,
        videoCropData.x, videoCropData.y, videoCropData.width, videoCropData.height,
        0, 0, miniCanvas.width, miniCanvas.height
    );
    miniCtx.globalAlpha = 1.0;

    // Draw overlay from main canvas - always draw as 1:2 ratio, then compress to canvas size
    // This ensures we get the 1:2 image compressed to whatever dimensions are specified
    miniCtx.drawImage(
        mainCanvas,
        sx, sy, cropWidth, cropHeight, // source crop (1:2 ratio from main canvas)
        0, 0, miniCanvas.width, miniCanvas.height // destination: compress to canvas size
    );
}

function polygon(x, y, radius, npoints, star=false) {
    let angle = 2 * Math.PI / npoints
    let impair=true;
    ctx.beginPath()
    for (let a = 0; a < 2 * Math.PI; a += angle) {
      impair = !impair
      let sx = x + Math.cos(a) * radius / 2 * (impair && star ? 0.4 : 1)
      let sy = y + Math.sin(a) * radius / 2 * (impair && star ? 0.4 : 1)
      ctx.lineTo(sx, sy)
    }
    ctx.closePath()
  }
  
  const shapeFunctions = [
    (x,y,s) => {
      ctx.fillStyle = "#558FFB"
      ctx.fillRect(x - s/2, y - s/2, s, s)
    },
    (x,y,s) => {
      ctx.fillStyle = "#EAE441"
      ctx.beginPath()
      ctx.ellipse(x, y, s/2, s/2, 0, 0, 2 * Math.PI)
      ctx.fill()
    },
    (x,y,s) => {
      ctx.fillStyle = "#2DE164"
      polygon(x,y,s,8)
      ctx.fill()
    },
    (x,y,s) => {
      ctx.fillStyle = "#E66AA5"
      polygon(x,y,s,16,true)
      ctx.fill()
    }
  ]
  
function distance (x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

const head_prev = [];
let hand_prev = [];

let body_prev = [];

// Optimized drawing loop
handsfree.use('drawAll', ({
    facemesh,
    hands,
    pose
}) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Set common drawing properties
    ctx.lineWidth = 2;

    // Draw face mesh
    if (facemesh?.multiFaceLandmarks) {
        facemesh.multiFaceLandmarks.forEach(landmarks => {
            if (FLAGS.head==0) {
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                for (let i=0 ; i< landmarks.length ; i++) {
                    const l = landmarks[i];               
                    const x = l.x * canvasWidth; // + offsetX;
                    const y = l.y * canvasHeight; // + offsetY;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate( i );
                    shapeFunctions[i % shapeFunctions.length](0, 0, i%16 + 8);
                    ctx.restore();
                }
            }
            else if (FLAGS.head==1) {
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                for (let i=0 ; i< landmarks.length ; i++) {
                    let closest = {x: 0, y: 0, dist: Infinity};
                    for (let j=0 ; j< landmarks.length ; j++) {
                        if (i == j) continue;
                        const dist = distance(landmarks[i].x, landmarks[i].y, landmarks[j].x, landmarks[j].y);
                        if (dist < closest.dist) closest = {...landmarks[j], dist};
                    }
                    ctx.beginPath();
                    ctx.moveTo(landmarks[i].x * canvasWidth, landmarks[i].y * canvasHeight);
                    ctx.lineTo(closest.x * canvasWidth, closest.y * canvasHeight);
                    ctx.stroke();
                }
            } else if (FLAGS.head==2) {
                ctx.fillStyle = 'transparent';
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 1;
                for (let i=0 ; i< landmarks.length ; i++) {
                    let closest = {x: 0, y: 0, dist: Infinity};
                    for (let j=0 ; j< landmarks.length ; j++) {
                        if (i == j) continue;
                        const dist = distance(landmarks[i].x, landmarks[i].y, landmarks[j].x, landmarks[j].y);
                        if (dist < closest.dist) closest = {...landmarks[j], dist};
                    }
                    ctx.beginPath();
                    const dist = distance(landmarks[i].x, landmarks[i].y, closest.x, closest.y);
                    ctx.strokeStyle = `hsl(${dist * 5000 + performance.now() / 10}, 100%, 50%)`;
                    ctx.strokeRect(landmarks[i].x * canvasWidth, landmarks[i].y * canvasHeight, dist * canvasWidth, dist * canvasHeight);
                    ctx.stroke();
                }
            } else if (FLAGS.head==3) {
                const list = ["🌱", "🌿", "🌻", "🌺", "🌹", "🌸", "🌴", "🐝", "🐶", "🐱", "🐔", "🐷", "🐴", "🐲", "💻", "📱", "📺", "🖥️", "🚀", "👽", "🤖"];
                for (let i=0 ; i< landmarks.length ; i++) {
                    const x = landmarks[i].x;
                    const y = landmarks[i].y;
                    const index = Math.floor((i + Math.floor(performance.now() / 250)) % list.length);
                    ctx.font = '22px serif'
                    ctx.textAlign = "center"; 
                    ctx.textBaseline = "middle"; 
                    const text = list[index];
                    ctx.fillStyle = 'black';
                    ctx.fillText(text, x * canvasWidth, y * canvasHeight);
                    ctx.strokeText(text, x * canvasWidth, y * canvasHeight);
                };
            }

            // landmarks.forEach(({
            //     x,
            //     y
            // }) => {

                // if (prev) {
                //     ctx.beginPath();
                //     ctx.moveTo(prev.x * canvasWidth, prev.y * canvasHeight);
                //     ctx.lineTo(x * canvasWidth, y * canvasHeight);
                //     ctx.stroke();
                // } 
                // prev = {
                //     x,
                //     y
                // };

                // ctx.beginPath();
                // ctx.arc(x * canvasWidth, y * canvasHeight, 1.5, 0, 2 * Math.PI);
                // ctx.font = '12px Arial';
                // ctx.fillStyle = '#00ff00';
                // ctx.fillText(`(${Math.round(x * 100)}%,${Math.round(y * 100)}%)`, x * canvasWidth + 5, y * canvasHeight + 15);
                // ctx.stroke();
            // });
        });
    }

    // Draw hand landmarks
    if (hands?.multiHandLandmarks) {
        for (let i = 0; i < hands.multiHandLandmarks.length; i++) {
            const landmarks = hands.multiHandLandmarks[i];
            
            if (hand_prev[i]) {
                hand_prev[i].push(landmarks);
                if (hand_prev[i].length > 10) hand_prev[i].shift();
            } else {
                hand_prev[i] = [landmarks];
            }

            if (FLAGS.hands==0) {
                ctx.strokeStyle = '#00ff00';
                ctx.fillStyle = '#000000';
                ctx.lineWidth = 2;
                // Draw connections
                HAND_CONNECTIONS.forEach(([start, end]) => {
                    const s = landmarks[start];
                    const e = landmarks[end];
                    ctx.beginPath();
                    ctx.moveTo(s.x * canvasWidth, s.y * canvasHeight);
                    ctx.lineTo(e.x * canvasWidth, e.y * canvasHeight);
                    ctx.stroke();
                });
                // Draw points
                [...hand_prev[i], landmarks].forEach((l, j)  => {
                    l.forEach(({
                        x,
                        y,
                    }) => {
                        ctx.beginPath();
                        // ctx.arc(x * canvasWidth, y * canvasHeight, 3 + j, 0, 2 * Math.PI);
                        ctx.arc(x * canvasWidth, y * canvasHeight, 4, 0, 2 * Math.PI);
                        ctx.stroke();
                    });
                });
            } 
            else if (FLAGS.hands==1) {
                const list = ["🌱", "🌿", "🌻", "🌺", "🌹", "🌸", "🌴", "🐝", "🐶", "🐱", "🐔", "🐷", "🐴", "🐲", "💻", "📱", "📺", "🖥️", "🚀", "👽", "🤖"];
                HAND_CONNECTIONS.forEach(([start, end], j) => {
                    const s = landmarks[start];
                    const e = landmarks[end];
                    for (let i=0 ; i<1 ; i+=0.2) {
                        const x = lerp(s.x, e.x, i);
                        const y = lerp(s.y, e.y, i);
                        const index = Math.floor((i*5 + j*5 + Math.floor(performance.now() / 250)) % list.length);
                        // ctx.font = '22px serif'
                        ctx.font = '12px serif'
                        ctx.textAlign = "center"; 
                        ctx.textBaseline = "middle"; 
                        const text = list[index];
                        ctx.fillStyle = 'black';
                        ctx.fillText(text, x * canvasWidth, y * canvasHeight);
                        ctx.strokeText(text, x * canvasWidth, y * canvasHeight);
                    }
                });
            }
            else if (FLAGS.hands==2) {
                HAND_CONNECTIONS.forEach(([start, end], j) => {
                    const s = landmarks[start];
                    const e = landmarks[end];
                    const ang = Math.atan2(e.y - s.y, e.x - s.x);
                    const dist = distance(s.x, s.y, e.x, e.y);
                    const x = lerp(s.x, e.x, 0.5);
                    const y = lerp(s.y, e.y, 0.5);
                    const w = dist * canvasWidth;
                    const h = 32;
                    ctx.strokeStyle = "red";
                    ctx.save();
                    ctx.translate(x * canvasWidth, y * canvasHeight);
                    ctx.rotate( ang );
                    // ctx.strokeRect(-w/2, -h/2, w, h);
                    // ctx.strokeRect(-w/2, -h/2, w, h);
                    ctx.strokeRect(-w/3, -h/3, w/3, h/3);
                    ctx.restore();
                });
            }
        };
    }

    // Draw pose keypoints
    if (pose?.poseLandmarks) {
        if (FLAGS.body==0) {
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;

            const MAX_SHADOW = 5

            body_prev.push(pose.poseLandmarks);
            if (body_prev.length > MAX_SHADOW) body_prev.shift();

            body_prev.forEach((l, j) => {
                POSE_CONNECTIONS.forEach(([start, end]) => {
                    const s = l[start];
                    const e = l[end];
                    const thickness = (MAX_SHADOW - j + 1) * 2; // Increase thickness with shadow depth
                    const opacity = j / MAX_SHADOW;
                    if (s && e) {
                        ctx.lineWidth = thickness;
                        let c = POSECOLORS[Math.floor(Math.random() * POSECOLORS.length)];
                        ctx.strokeStyle = `rgba(${c}, ${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(s.x * canvasWidth, s.y * canvasHeight);
                        ctx.lineTo(e.x * canvasWidth, e.y * canvasHeight);
                        ctx.stroke();
                    }
                })
            })

            // // Draw connections
            // POSE_CONNECTIONS.forEach(([start, end]) => {
            //     const s = pose.poseLandmarks[start];
            //     const e = pose.poseLandmarks[end];
            //     if (s && e) {
            //         ctx.beginPath();
            //         ctx.moveTo(s.x * canvasWidth, s.y * canvasHeight);
            //         ctx.lineTo(e.x * canvasWidth, e.y * canvasHeight);
            //         ctx.stroke();
            //     }
            // });

            // // Draw keypoints (excluding face and hand indices)
            // const ignoredIndices = []//[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 18, 19, 20, 21, 22];
            // pose.poseLandmarks.forEach(({
            //     x,
            //     y
            // }, i) => {
            //     if (!ignoredIndices.includes(i)) {
            //         ctx.beginPath();
            //         ctx.arc(x * canvasWidth, y * canvasHeight, 4, 0, 2 * Math.PI);
            //         // ctx.arc(x * canvasWidth, y * canvasHeight, 1.5, 0, 2 * Math.PI);
            //         ctx.font = '12px Arial';
            //         ctx.fillStyle = '#00ff00';
            //         ctx.fillText(`(${i})`, x * canvasWidth + 5, y * canvasHeight + 15);
            //         ctx.stroke();
            //     }
            // });
        }
    }

    // Update mini canvas with frame rate limiting
    if (hasCustomSize) drawMiniCanvas();
});

// Camera switch button logic
const switchButton = document.getElementById('camera-switch');
// Hide button by default until we detect multiple cameras
switchButton.style.display = 'none';
// Show button only if more than one video input device is available
navigator.mediaDevices.enumerateDevices().then(devices => {
    const videoInputs = devices.filter(d => d.kind === 'videoinput');
    if (videoInputs.length > 1) switchButton.style.display = 'block';
}).catch(err => console.error('Device enumeration error:', err));
switchButton.addEventListener('click', () => {
    // Reload page with updated camera parameter, preserving other query params
    const params = new URLSearchParams(window.location.search);
    const next = params.get('cam') === 'environment' ? 'user' : 'environment';
    params.set('cam', next);
    window.location.search = params.toString();
});

// Fullscreen toggle button logic
const fullscreenButton = document.getElementById('fullscreen-toggle');
fullscreenButton.addEventListener('click', () => {
    // Use the Fullscreen API with vendor prefixes for compatibility
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { // Safari
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE11
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE11
            document.msExitFullscreen();
        }
    }
});