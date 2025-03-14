const event_list_container = document.getElementById("cyberspace-rdvs")
const event_item_template = document.getElementById("tem-rdv")

function cloneEventTemplate(name, date, now=false) {
    const node_event = event_item_template.cloneNode(true).content.querySelector(".rdv")
    node_event.querySelector(".name").innerHTML = name
    node_event.querySelector(".date").innerHTML = now ? "En cours" : date
    return node_event
}

//

function formateDate(date) {
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
    const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "aoüt", "septembre", "octobre", "novembre", "décembre"]
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} - ${date.getHours()}h${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}`
}

var hasEventsLoaded = false;

async function loadEvents() {
    if (FEATURES.tribe_page && !userData.tribe_id) return;
    return new Promise((resolve, reject) => {
        clock.clear("events-list")
        let eventLive = false;
        if (hasEventsLoaded) return
        QUERY.getEvents().then(res => {
            if (res.status && res.data) {    
                event_list_container.innerHTML = ""
                let mapTriggered = false;
                let liveTriggered = false;
                res.data.forEach(event_data => {
                    const event_name = event_data.name
                    // const event_countdown = parseCountDown(event_data.start_date, true)
                    let now = new Date().getTime() > new Date(event_data.start_date).getTime()
                    const event_date = new Date(event_data.start_date)
                    const el = cloneEventTemplate(
                        event_name,
                        formateDate(event_date),
                        now
                    )

                    const liveEventHandler = () => {
                        // if (!event_data.priority) return
                        if (isEventLive(event_data.start_date)) {
                            if (liveTriggered) return
                            liveTriggered = true
                            socketEventLive(userData.uuid, true)
                            PAGES.goto("live-idle")
                            showNavbar(false)
                            resolve(true)
                        } else if (isIncoming(event_data.start_date)) {
                            if (mapTriggered) return
                            mapTriggered = true
                            openEventMap(event_data)
                            showNavbar(true)
                            resolve(true)
                        }
                    }
                    liveEventHandler();

                    clock.add("cyberspace", () => {
                        now = new Date().getTime() > new Date(event_data.start_date).getTime()
                        el.querySelector(".date").innerHTML = now ? "En cours" : formateDate(event_date)
                        liveEventHandler();
                    })

                    el.addEventListener("click", () => {
                        goto_event(event_data)
                    })

                    event_list_container.appendChild(el)
                });
                hasloaded = true
                if (!mapTriggered && !liveTriggered) {
                    PAGES.goto("cyberspace")
                    showNavbar(true)
                }
                resolve(false)
            }
        })
    })
}

function isIncoming(date) {
    const now = new Date().getTime()
    const incomingDate = new Date(date).getTime()
    const ONE_HOUR = 1000 * 60 * 60
    return incomingDate - now < ONE_HOUR
}

function isNow(date) {
    const now = new Date().getTime()
    const eventDate = new Date(date).getTime()
    return eventDate - now < 0
}

const countdown_days = document.getElementById("countdown-days")
const countdown_hours = document.getElementById("countdown-hours")
const countdown_minutes = document.getElementById("countdown-minutes")

function goto_event(eventData) {
    if (isNow(eventData.start_date)) {
        PAGES.goto("live-idle")
        socketEventLive(userData.uuid, true)
        showNavbar(false)
    } else if (isIncoming(eventData.start_date)) {
        openEventMap(eventData)
    } else {
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
}

// Map
// 

var leafletMap = L.map('event-location-map').setView([42.71885, 1.83801], 18);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ''
}).addTo(leafletMap);

const attributionControl = leafletMap.attributionControl;
leafletMap.removeControl(attributionControl);

var customIcon = L.icon({
    iconUrl: document.BASEPATH + '/img/pin.png',
    iconSize:     [32, 32],
    iconAnchor:   [16, 16],
    popupAnchor:  [0, -32] 
});

function openEventMap(evenement) {
    PAGES.goto("event-location")
    QUERY.getEventLocation(evenement.id).then(res => {
        if (res.status && res.data) {
            SetMapCoords(res.data)
            document.getElementById("event-location-txt").innerText = res.data.name
        }
    })
}

function SetMapCoords(evenement) 
{
    leafletMap.invalidateSize(false);
    if (!evenement.coords) return false;
    
    let popupText = evenement.name;
    const [lat, lon] = evenement.coords; 
    const zoom = 18;

    /*
    if (loc.length>=2) {
        lat = loc[0];
        lon = loc[1];
        zoom = (loc.length==3) ? loc[2] : 18;
    } 
    else {
        loc = evenement.location_coords.split("/")
        if (loc.length>=2) {
            zoom = (loc.length==3) ? loc[0] : 18;
            lat = (loc.length==3) ? loc[1] : loc[0];
            lon = (loc.length==3) ? loc[2] : loc[1];
        }
    }  
    */

    leafletMap.setView([lat, lon], zoom);

    leafletMap.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            leafletMap.removeLayer(layer);
        }
    });

    var p = L.marker([lat, lon], {icon: customIcon}).addTo(leafletMap).bindPopup(popupText)

    const btn = document.getElementById("event-location-goto");
    btn.href = "https://maps.google.com/?q="+lat+","+lon+"&z="+zoom;

    setTimeout(() => {
        p.openPopup();
    }, 700);
}