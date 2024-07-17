PAGES.addCallback("main", () => {
    UTIL.shownav(true);
    
    const eventWithLowestDate = getClosestEvent();
    if (!eventWithLowestDate) return;

    if (isEventActive()) {
        PAGES.goto("event-idle");
    } else {
        const date = eventWithLowestDate.starting_at.split('T');
        UTIL.setCoundDown(date[0], date[1]);
        PAGES.goto("event-countdown")
    }
});

function getClosestEvent() {
    if (!userData) return;
    if (userData.sessions.length == 0) return false;

    const events = userData.sessions[0].events;
    const incomingEvents = events.filter(event => new Date(event.ending_at) > new Date());

    if (incomingEvents.length == 0) return false;

    return incomingEvents.reduce((minEvent, currentEvent) => {
        const minDate = new Date(minEvent.starting_at);
        const currentDate = new Date(currentEvent.starting_at);
        return currentDate < minDate ? currentEvent : minEvent;
    });
}

function isEventActive() {
    const event = getClosestEvent();
    if (!event) return false;

    const now = new Date();
    const start = new Date(event.starting_at);
    const end = new Date(event.ending_at);
    return now > start && now < end;
}