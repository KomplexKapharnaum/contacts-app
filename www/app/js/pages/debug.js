class DebuggerClicker {
    constructor(element, callback) {
        this.element = element;
        this.callback = callback;
        this.pressCount = 0;
        this.pressTimeOut;
        this.element.addEventListener("click", this.onClick.bind(this));
    }

    onClick() {
        this.pressCount++;
        if (this.pressCount === 10) {
            this.callback();
        }
        clearTimeout(this.pressTimeOut)
        this.pressTimeOut = setTimeout(() => { this.pressCount = 0; }, 500);
    }
}

const debugTrigger = document.getElementById("debug-trigger");
new DebuggerClicker(debugTrigger, () => {
    if (confirm("changer de tribu ?")) {
        QUERY.process("reset_my_tribe", {uuid: userData.uuid})
            .then(res => {
                if (res.status) {
                    alert("tribu reset")
                    location.reload();
                }
            })
    }
});

const eventDebugger = document.getElementById('debug-event')

new DebuggerClicker(eventDebugger, () => {
    const lastevent = LIVE.anyEventLive()
    LIVE.eventInit(lastevent, true)
});