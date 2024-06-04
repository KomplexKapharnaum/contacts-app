PAGES.addCallback("event-countdown", () => {
    UTIL.shownav(true);

    if (!userData) return;
    if (userData.sessions.length == 0) return;
    console.log("hello")
    const events = userData.sessions[0].events;
    
    const incomingEvents = events.filter(event => new Date(event.ending_at) > new Date());

    const eventWithLowestDate = incomingEvents.reduce((minEvent, currentEvent) => {
        const minDate = new Date(minEvent.starting_at);
        const currentDate = new Date(currentEvent.starting_at);
        return currentDate < minDate ? currentEvent : minEvent;
    });

    const now = new Date();
    const start = new Date(eventWithLowestDate.starting_at);
    const end = new Date(eventWithLowestDate.ending_at);
    if (now > start && now < end) {
        PAGES.goto("event-idle");
    } else {
        const date = eventWithLowestDate.starting_at.split('T');
        UTIL.setCoundDown(date[0], date[1]);
    }
});