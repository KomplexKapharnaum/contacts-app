PAGES.addCallback("main", () => {
    UTIL.shownav(true);
    
    if (!userData) return;
    if (userData.sessions.length==0) return;
    
    if (userData.sessions[0].events.length==0) return;
    
    if (userData.sessions[0].events.length==1) {
        PAGES.goto("event-countdown");
        UTIL.setCountDown(...userData.sessions[0].events[0].starting_at.split("T"));
    } else {
        PAGES.goto("event-list");
    }
})

PAGES.addCallback("event-list", () => {
    UTIL.shownav(true);
    
    const eventWithLowestDate = getClosestEvent();
    if (!eventWithLowestDate) return;

    if (isEventActive()) {
        PAGES.goto("event-idle");
        UTIL.shownav(false);
    } else {
        const now = new Date();
        const start = new Date(eventWithLowestDate.starting_at);
        const diff = start - now;
        if (diff > 0 && diff < 1 * 60 * 60 * 1000) {
            if (eventWithLowestDate.location) {
                const coords = eventWithLowestDate.location.split('/');
                UTIL.setMapCoords(coords[0], coords[1], coords[2], eventWithLowestDate.description);

            }
            PAGES.goto("event-location");
        } /*else {
            const date = eventWithLowestDate.starting_at.split('T');
            UTIL.setCoundDown(date[0], date[1]);
            PAGES.goto("event-countdown")    
        }*/
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

// Leaflet map
//

var leafletMap = L.map('coords-map').setView([42.71885, 1.83801], 18);

// L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ''
}).addTo(leafletMap);

const attributionControl = leafletMap.attributionControl;
leafletMap.removeControl(attributionControl);

PAGES.addCallback("event-location", function() {
    UTIL.shownav(false);
    leafletMap.invalidateSize(false);
    
    const closest = getClosestEvent();
    setInterval(() => {
        eventTime = new Date(closest.starting_at);
        if (new Date() > eventTime) {
            location.reload();
        }
    }, 1000);    
});

var customIcon = L.icon({
    iconUrl: './img/pin.png',
    // shadowUrl: 'leaf-shadow.png',

    iconSize:     [64, 64], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [32, 64], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [0, -64] // point from which the popup should open relative to the iconAnchor
});

UTIL.setMapCoords = function(zoom, lat, lon, popupText) {
    leafletMap.setView([lat, lon], zoom);
    leafletMap.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            leafletMap.removeLayer(layer);
        }
    });
    var p = L.marker([lat, lon], {icon: customIcon}).addTo(leafletMap).bindPopup(popupText)
    const btn = document.getElementById("event-location-coords-button");
    btn.href = "geo:" + lat + "," + lon;
    setTimeout(() => {
        p.openPopup();
    }, 700);
}
