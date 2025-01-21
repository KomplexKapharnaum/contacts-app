const video_debug = document.getElementById("video-debug");
const video_debug_capture = document.getElementById("video-debug-capture");
const video_debug_canvas = document.getElementById("video-debug-canvas");

PAGES.addCallback("debug-camera", () => {
    const constraints = {
        audio: false,
        video: { width: { ideal: 400 }, height: { ideal: 400 } }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video_debug.srcObject = stream;
            video_debug.play();
            video_debug_capture.addEventListener("click", () => {
                stream.getTracks().forEach(track => track.stop());
            });
        })
        .catch(error => {
            console.error('Error opening video camera.', error);
        });
})

video_debug_capture.addEventListener("click", () => {
    const canvas = document.getElementById("video-debug-canvas");
    const context = canvas.getContext("2d");
    context.drawImage(video_debug, 0, 0, canvas.width, canvas.height);
})
