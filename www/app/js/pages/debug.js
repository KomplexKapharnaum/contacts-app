const debugTrigger = document.getElementById("debug-trigger")
let debugPressTimer;
let debugPressCount = 0;
let debugPressTimeOut;

debugTrigger.addEventListener("touchstart", () => {
    debugPressCount++;
    if (debugPressCount === 10) {
        if (confirm("changer de tribu ?")) {
            QUERY.process("reset_my_tribe", {uuid: userData.uuid})
            .then(res => {
                if (res.status) {
                    alert("tribu reset")
                    location.reload();
                }
            })
        }
    }
    clearTimeout(debugPressTimeOut)
    debugPressTimeOut = setTimeout(() => { debugPressCount = 0; }, 500);
});