// Initialize Handsfree.js with face, hands, and pose enabled
const handsfree = new Handsfree({
  showDebug: false,
  hands: {
    enabled: true,
    minDetectionConfidence: 0.8 // Increase to reduce sensitivity
  },
  pose: true,
  facemesh: true
});

const preview = document.getElementById('preview');
const mainCanvas = document.getElementById('canvas');
const ctx = mainCanvas.getContext('2d');
mainCanvas.width = 1024;
mainCanvas.height = 768;

const miniCanvas = document.getElementById('mini-canvas');
const miniCtx = miniCanvas.getContext('2d');

// If ?width= and ?height= are provided, use them for miniCanvas
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('w')) miniCanvas.width = parseInt(urlParams.get('w'), 10);
else miniCanvas.width = 384; // Default width
if (urlParams.has('h')) miniCanvas.height = parseInt(urlParams.get('h'), 10);
else miniCanvas.height = miniCanvas.width*2; // Default height

// if neither width nor height are provided hide miniCanvas
if (!urlParams.has('w') && !urlParams.has('h')) {
  miniCanvas.style.display = 'none';
} else {
  preview.style.display = 'none'; // Hide preview video if miniCanvas is used
  mainCanvas.style.display = 'none';
  // hide h3
  const h3 = document.querySelector('h3');
  if (h3) h3.style.display = 'none';

}

// Main canvas dimensions
const mainWidth = mainCanvas.width;
const mainHeight = mainCanvas.height;

// Calculate maximal 1:2 crop
let cropHeight = mainHeight;
let cropWidth = cropHeight / 2;
if (cropWidth > mainWidth) {
  cropWidth = mainWidth;
  cropHeight = cropWidth * 2;
}
const sx = (mainWidth - cropWidth) / 2;
const sy = (mainHeight - cropHeight) / 2;

// Crop video
var VcropHeight, VcropWidth, sxV, syV = 0;

// Start webcam and Handsfree.js
handsfree.start();
// handsfree.enablePlugins('browser');

// Mirror the video for a natural webcam feel
preview.style.transform = 'scaleX(-1)';
mainCanvas.style.transform = 'scaleX(-1)';
miniCanvas.style.transform = 'scaleX(-1)';

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  preview.srcObject = stream;
});

preview.addEventListener('loadedmetadata', () => {
  const w = preview.videoWidth;
  const h = preview.videoHeight;
  VcropHeight = h;
  VcropWidth = VcropHeight / 2;
  if (VcropWidth > w) {
    VcropWidth = w;
    VcropHeight = VcropWidth * 2;
  }
  sxV = (w - VcropWidth) / 2;
  syV = (h - VcropHeight) / 2;
})

//
// DRAW
//

// Define hand connections (MediaPipe Hands format)
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],[2,5], // Thumb
  [5,6],[6,7],[7,8],      // Index
  [5,9],[9,10],[10,11],[11,12], // Middle
  [9,13],[13,14],[14,15],[15,16], // Ring
  [13,17],[17,18],[18,19],[19,20], // Pinky
  [0,17] // Palm base to pinky base
];

// Define pose connections (MediaPipe Pose format)
const POSE_CONNECTIONS = [
  //   [0,1],[1,2],[2,3],[3,4], // Face
  //   [0,5],[5,6],[6,7],[7,8], // Face
  //  [9,10], // Mouth
  [11,12], // Shoulders
  [11,13],[13,15], // Left arm
  [12,14],[14,16], // Right arm
    [11,23],[12,24], // Shoulders to hips
    [23,24], // Hips
    [24,26],[26,28], // Right leg
    [23,25],[25,27], // Left leg
    [27,29], [29,31], // Left foot
    [28,30],[30,32], // Right foot
];

function drawMiniCanvas() {
  miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);

  miniCtx.globalAlpha = 0.3;
  miniCtx.drawImage(
    preview,
    sxV, syV, VcropWidth, VcropHeight, // source crop
    0, 0, miniCanvas.width, miniCanvas.height   // destination: square, compressed
  );
  miniCtx.globalAlpha = 1.0;

  console.log(`sxV, syV, VcropWidth, VcropHeight: ${sxV}, ${syV}, ${VcropWidth}, ${VcropHeight}`);

  // Deform: draw 512x1024 into 512x512 (compress vertically)
  miniCtx.drawImage(
    mainCanvas,
    sx, sy, cropWidth, cropHeight, // source crop
    0, 0, miniCanvas.width, miniCanvas.height   // destination: square, compressed
  );
}

// Drawing loop
handsfree.use('drawAll', ({facemesh, hands, pose}) => {
  ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

  // Draw face mesh
  if (facemesh && facemesh.multiFaceLandmarks) {
    facemesh.multiFaceLandmarks.forEach(landmarks => {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      for (let i = 0; i < landmarks.length; i++) {
        const {x, y} = landmarks[i];
        ctx.beginPath();
        ctx.arc(x * mainCanvas.width, y * mainCanvas.height, 1.5, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  }

  // Draw hand landmarks
  if (hands && hands.multiHandLandmarks) {
    hands.multiHandLandmarks.forEach(landmarks => {
        // Draw segments
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        HAND_CONNECTIONS.forEach(([start, end]) => {
            const s = landmarks[start], e = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(s.x * mainCanvas.width, s.y * mainCanvas.height);
            ctx.lineTo(e.x * mainCanvas.width, e.y * mainCanvas.height);
            ctx.stroke();
        });
        // Draw points (as before)
        for (let i = 0; i < landmarks.length; i++) {
            const {x, y} = landmarks[i];
            ctx.beginPath();
            ctx.arc(x * mainCanvas.width, y * mainCanvas.height, 3, 0, 2 * Math.PI);
            ctx.stroke();
        }
    });
  }

//   // Match Wrists
//   const VISIBILITY_THRESHOLD = 0.5;
//   if (pose && pose.poseLandmarks && hands && hands.multiHandLandmarks) {
//     hands.multiHandLandmarks.forEach((handLandmarks, handIndex) => {
//         // Determine handedness if available
//         let isLeft = false;
//         if (hands.multiHandedness && hands.multiHandedness[handIndex]) {
//             isLeft = hands.multiHandedness[handIndex].label === 'Left';
//         } else {
//             // Fallback: assume first hand is right, second is left
//             isLeft = handIndex === 1;
//         }
//         const poseWristIndex = isLeft ? 15 : 16;
//         const poseWrist = pose.poseLandmarks[poseWristIndex];

//         // Only overwrite if pose wrist is not visible
//         if (poseWrist.visibility !== undefined && poseWrist.visibility < VISIBILITY_THRESHOLD) {
//         pose.poseLandmarks[poseWristIndex] = {
//             x: handLandmarks[0].x,
//             y: handLandmarks[0].y,
//             z: handLandmarks[0].z !== undefined ? handLandmarks[0].z : 0,
//             visibility: 1 // Set to high confidence since hand is detected
//         };
//         }
//     });
//   }


  // Draw pose keypoints
  if (pose && pose.poseLandmarks) {
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    POSE_CONNECTIONS.forEach(([start, end]) => {
        const s = pose.poseLandmarks[start], e = pose.poseLandmarks[end];
        if (s && e) {
        ctx.beginPath();
        ctx.moveTo(s.x * mainCanvas.width, s.y * mainCanvas.height);
        ctx.lineTo(e.x * mainCanvas.width, e.y * mainCanvas.height);
        ctx.stroke();
        }
    });

    // ignore <=10,  17, 19, 21, 18, 20 , 22
    const ignoredIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 19, 21, 18, 20, 22];
    pose.poseLandmarks.forEach(({x, y}, i) => {
        if (!ignoredIndices.includes(i)) {
            ctx.beginPath();
            ctx.arc(x * mainCanvas.width, y * mainCanvas.height, 4, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = '#ff00ff';
            ctx.font = '12px Arial';
            ctx.fillText(i.toString(), x * mainCanvas.width + 5, y * mainCanvas.height);
        }
    });
    }

    drawMiniCanvas();
});