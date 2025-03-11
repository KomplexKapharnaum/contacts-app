const debugTrigger = document.getElementById("debug-trigger")

let debugPressTimer;

debugTrigger.addEventListener("touchstart", () => {
    console.log("touchstart")
    debugPressTimer = setTimeout(() => {
        console.log("Debug trigger pressed for 5 seconds");
        // Add your logic here for when the button is pressed for 5 seconds
    }, 5000);
});

debugTrigger.addEventListener("touchend", () => {
    clearTimeout(debugPressTimer);
});

debugTrigger.addEventListener("touchcancel", () => {
    clearTimeout(debugPressTimer);
});