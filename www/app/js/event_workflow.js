const LIVE = {}

LIVE.eventLive = false
LIVE.lastCommand = false
LIVE.insideEvent = false

LIVE.getLastCommand = async (uuid) => {
    return new Promise((resolve, reject) => {
        document.SOCKETIO.emit('live-uptodate', uuid)  
        document.SOCKETIO.once('start-event', (data) => {
            LIVE.lastCommand = data
            resolve(data)
        });
    })
}

LIVE.showCountDown = () => {
    const countdown_days = document.getElementById("countdown-days")
    const countdown_hours = document.getElementById("countdown-hours")
    const countdown_minutes = document.getElementById("countdown-minutes")
    PAGES.goto("event-countdown")
    const updateCountdown = () => {
        const countdown = parseCountDown(eventData.start_date, false)
        countdown_days.innerHTML = countdown.d
        countdown_hours.innerHTML = countdown.h
        countdown_minutes.innerHTML = countdown.m
    }
    clock.clear("event-countdown")
    clock.add("event-countdown", updateCountdown)
    updateCountdown()
}

LIVE.eventInit = async (event_data) => {
    const lastCommand = await LIVE.getLastCommand()
    if (event_data.priority) {
        setEventCloseButtonsState(true)
        if (lastCommand) {
            receiveSessionEvent(lastCommand)
        } else {
            PAGES.goto("live-idle")
        }
    }
}

LIVE.eventClicked = (event_data) => {
    if (isNow(event_data.start_date)) {
        LIVE.eventInit(event_data)
    } else {
        LIVE.showCountDown()
    }
}

LIVE.anyEventLive = () => {
    if (!loadedEvents) return false
    loadedEvents.forEach(event => {
        if (isNow(event.start_date)) {
            return event
        }
    });
    return false
}

LIVE.newCommandReceived = (commandData) => {
    const priority = LIVE.anyEventLive();
    if (LIVE.insideEvent || priority) {
        setEventCloseButtonsState(true)
        receiveSessionEvent(commandData)
    }
}