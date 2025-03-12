const debugTrigger = document.getElementById("debug-trigger")

let debugPressTimer;

let debugPressCount = 0;

let debugPressTimeOut;
debugTrigger.addEventListener("touchstart", () => {
    console.log("debug trigger");
    debugPressCount++;
    console.log(debugPressCount);

    if (debugPressCount === 10) {
        PAGES.goto("debug");
    }
    clearTimeout(debugPressTimeOut)
    debugPressTimeOut = setTimeout(() => { debugPressCount = 0; }, 500);
});