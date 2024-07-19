let EVENT_INFO = false;

function isEventActive() {
    return EVENT_INFO && EVENT_INFO.active;
}

function processEventRouting() {
    PAGES.goto(getEventRoute());
}

function getEventRoute() {

    if (!userData) return "main";
    if (!userData.sessions) return "main";
    if (!userData.sessions[0].events) return "main";

    // Only get incoming events
    let evenements = userData.sessions[0].events.filter(event => new Date(event.ending_at) > new Date());

    // Update incoming events list
    UTIL.clearIncomingEvents();
    evenements.forEach(evenement => UTIL.addIncomingEvent(evenement));

    // No events = main
    if (evenements.length==0) return "main";

    // Get closest event
    const closest = evenements.reduce((minEvent, currentEvent) => {
        const minDate = new Date(minEvent.starting_at);
        const currentDate = new Date(currentEvent.starting_at);
        return currentDate < minDate ? currentEvent : minEvent;
    });

    EVENT_INFO = {
        active: false,
        closest: closest
    };

    // Get the time state of the closest event
    let eventState;
    const now = new Date();
    const start = new Date(closest.starting_at);
    const diff = start - now;
    const one_hour = 60 * 60 * 1000;

    // If the event is in an hour
    if (diff > 0 && diff < one_hour) {
        eventState = "inAnHour"; // The event is in an hour or less
    } else if (diff > one_hour) {
        eventState = "inFuture"; // The event is in more than an hour
    } else {
        EVENT_INFO.active = true;
        eventState = "active"; // The event is active
    }

    // If there is only one event
    if (evenements.length==1) {
        switch (eventState) {
            case "inAnHour":
                return "event-location";
            case "inFuture":
                UTIL.selectedEvent = closest;
                return "event-countdown";
            case "active":
                return "event-idle";
        }       
    }

    // If there are multiple events
    switch (eventState) {
        case "inAnHour":
            return "event-location";
        case "inFuture":
            return "event-list";
        case "active":
            return "event-idle";
    }
}

/* Events pages callbacks */
/* */

PAGES.addCallback("event-countdown", function() {
    UTIL.setCountDown(...UTIL.selectedEvent.starting_at.split("T"));
})

PAGES.addCallback("event-location", function() {
    // UTIL.shownav(false);
    leafletMap.invalidateSize(false);
    
    setInterval(() => {
        eventTime = new Date(EVENT_INFO.closest.starting_at);
        if (new Date() > eventTime) {
            location.reload();
        }
    }, 1000);
});

PAGES.addCallback("event-idle", () => {
    UTIL.shownav(false);
    UTIL.countDownInterval = false;
})

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
    if (UTIL.getMobileOperatingSystem() == "iOS") 
        btn.href = "maps://maps.apple.com/?q="+lat+","+lon+"&z="+zoom;
    else
        btn.href = "https://maps.google.com/?q="+lat+","+lon+"&z="+zoom;
    
    setTimeout(() => {
        p.openPopup();
    }, 700);
}

UTIL.getMobileOperatingSystem = function() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}
