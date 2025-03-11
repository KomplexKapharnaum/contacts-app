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

const debugInputFile = document.getElementById("debug-input-file");
const debugInputPreview = document.getElementById("debug-input-preview");

debugInputFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            debugInputPreview.innerHTML = "";
            debugInputPreview.appendChild(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});