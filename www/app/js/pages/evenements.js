let EVENT_WATCHER = null

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

    return "event-list";
}

PAGES.addCallback("event-list", () => {
    UTIL.shownav(true);
    
    // Get events 
    let evenements = userData.sessions[0].events.filter(event => new Date(event.ending_at) > new Date());
    evenements = evenements.sort((a,b) => new Date(a.starting_at) - new Date(b.starting_at));

    UTIL.clearIncomingEvents();
    evenements.forEach(evenement => {
        UTIL.addIncomingEvent(evenement);
    });
});

/* Events pages callbacks */
/* */

PAGES.addCallback("event-countdown", function() {
    UTIL.setCountDown(UTIL.selectedEvent);
})

PAGES.addCallback("event-location", function() {
    // UTIL.shownav(false);

    leafletMap.invalidateSize(false);
    UTIL.setMapCoords(UTIL.selectedEvent);

    // Set event time
    let eventTime = new Date(UTIL.selectedEvent.starting_at);
    let eventTimeStr = eventTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById("event-location-hour").innerHTML = eventTimeStr;

    // Watch for event time
    /*
    if (EVENT_WATCHER) clearInterval(EVENT_WATCHER);
        EVENT_WATCHER = setInterval(() => {
            eventTime = new Date(UTIL.selectedEvent.starting_at);
            if (new Date() > eventTime) {
                location.reload();
            }
        }, 1000);
    */
});

PAGES.addCallback("event-idle", () => {
    UTIL.shownav(false);
    UTIL.countDownInterval = false;

    /*
    // Watch for event end
    if (EVENT_WATCHER) clearInterval(EVENT_WATCHER);
        EVENT_WATCHER = setInterval(() => {
            let eventEnd = new Date(UTIL.selectedEvent.ending_at);
            if (new Date() > eventEnd) {
                location.reload();
            }
        }, 1000);
    */
})

document.addEventListener("click", () => {
    if (PAGES.active().dataset.pageId == "event-idle") {
        document.documentElement.requestFullscreen();
    }
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

//Bjørnøya 17/63.58860/9.17471


UTIL.setMapCoords = function(evenement) 
{
    let zoom, lat, lon;
    let popupText = evenement.description;

    if (!evenement.location) evenement.location = "63.58860,9.17471,17";

    // parse either lat,lon,(zoom) or (zoom)/lat/lon
    let loc = evenement.location.split(",")
    if (loc.length>=2) {
        lat = loc[0];
        lon = loc[1];
        zoom = (loc.length==3) ? loc[2] : 18;
    } 
    else {
        loc = evenement.location.split("/")
        if (loc.length>=2) {
            zoom = (loc.length==3) ? loc[0] : 18;
            lat = (loc.length==3) ? loc[1] : loc[0];
            lon = (loc.length==3) ? loc[2] : loc[1];
        }
    }  

    leafletMap.setView([lat, lon], zoom);
    leafletMap.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            leafletMap.removeLayer(layer);
        }
    });
    var p = L.marker([lat, lon], {icon: customIcon}).addTo(leafletMap).bindPopup(popupText)
    const btn = document.getElementById("event-location-coords-button");
    // if (UTIL.getMobileOperatingSystem() == "iOS") 
    //     btn.href = "maps://maps.apple.com/?q="+lat+","+lon+"&z="+zoom;
    // else
        btn.href = "https://maps.google.com/?q="+lat+","+lon+"&z="+zoom; 
    
    // href: "geo:<" + myLatitude  + ">,<" + myLongitude + ">?q=<" + myLatitude  + ">,<" + myLongitude + ">(" + labelLocation + ")"));
    
    // btn.href = "geo:"+lat+","+lon+"?q="+lat+","+lon

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
