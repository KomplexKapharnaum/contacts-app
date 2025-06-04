const event_list_container = document.getElementById("cyberspace-rdvs")
const event_item_template = document.getElementById("tem-rdv")

function cloneEventTemplate(name, date, now=false) {
    const node_event = event_item_template.cloneNode(true).content.querySelector(".rdv")
    node_event.querySelector(".name").innerHTML = name
    node_event.querySelector(".date").innerHTML = now ? "En cours" : date
    return node_event
}

function formateDate(date) {
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
    const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "aoüt", "septembre", "octobre", "novembre", "décembre"]
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} - ${date.getHours()}h${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}`
}

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

LIVE.showCountDown = (eventData) => {
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

LIVE.getCommandFromPack = (data_pack) => {
    if (!userData) return

    const userGroup = userData.tribe_id
    const data = data_pack[userGroup] ? data_pack[userGroup] : data_pack[0]
    if (!data) {return false}
    return data
}

LIVE.eventInit = async (event_data, force=false) => {
    if (!userData) return
    const lastCommand = await LIVE.getLastCommand(userData.uuid)
    if (event_data.priority || force) {
        setEventCloseButtonsState(true)
        LIVE.insideEvent = true
        if (lastCommand) {
            const cmd = LIVE.getCommandFromPack(lastCommand)
            receiveSessionEvent(cmd)
        } else {
            PAGES.goto("live-idle")
            map_idle.updateMap(event_data)
        }
    }
}

LIVE.eventClicked = (event_data) => {
    if (isNow(event_data.start_date)) {
        LIVE.eventInit(event_data, true)
    } else if (isIncoming(event_data.start_date)) {
        openEventMap(event_data)
    } else {
        LIVE.showCountDown(event_data)
    }
}

LIVE.anyEventLive = () => {
    if (!loadedEvents) return false;
    for (let event of loadedEvents) {
        if (isNow(event.start_date)) {
            return event;
        }
    }
    return false;
}

LIVE.getLatestEventPriority = () => {
    const lastEvent = LIVE.anyEventLive();
    if (!lastEvent) return false
    return lastEvent.priority
}

LIVE.newCommandReceived = (commandData) => {
    const priority = LIVE.getLatestEventPriority();
    if (LIVE.insideEvent || priority) {
        setEventCloseButtonsState(true)
        receiveSessionEvent(commandData)
    }
}

LIVE.closeEvent = () => {
    PAGES.goto("cyberspace")
    setEventCloseButtonsState(false)
}

let inside_event = false;
let loadedEvents = false;
let currentEventPriority = false;
async function loadEvents() {
    // First check if app should load events
    if (FEATURES.tribe_page && (!('tribe_id' in userData) || !userData.tribe_id)) return;
    if (loadedEvents) return;

    clock.clear("events-list");

    const query_events = await QUERY.getEvents();

    if (query_events.status && query_events.data) {
        event_list_container.innerHTML = "";
        loadedEvents = query_events.data;
    }

    // Load events and create dom elements
    query_events.data.forEach(event_data => {
        const event_name = event_data.name
        let now = new Date().getTime() > new Date(event_data.start_date).getTime()
        const event_date = new Date(event_data.start_date)

        let clock_event_triggered = false;

        if (now) {
            clock_event_triggered = true
            LIVE.eventInit(event_data)
        }

        const el = cloneEventTemplate(
            event_name,
            formateDate(event_date),
            now
        )

        el.addEventListener("click", () => {
            LIVE.eventClicked(event_data)
        })

        clock.add("cyberspace", () => {
            now = new Date().getTime() > new Date(event_data.start_date).getTime()
            el.querySelector(".date").innerHTML = now ? "En cours" : formateDate(event_date)
            
            if (now && !clock_event_triggered) {
                LIVE.eventInit(event_data)
                clock_event_triggered = true
            }
        })

        event_list_container.appendChild(el)
    });

    PAGES.goto("cyberspace");
    showNavbar(true);
}



// function liveEventHandler() {
//     if (!loadedEvents) return;

//     loadedEvents.forEach(data => {
        
//         // Check if event is live
//         if (isEventLive(data.start_date)) {
//             socketEventLive(userData.uuid, true)
//             PAGES.goto("live-idle")
//             setEventCloseButtonsState(!data.priority)
//             showNavbar(false)
//             return;
//         // Check if event is incoming
//         } else if (isIncoming(data.start_date)) {
//             openEventMap(data)
//             showNavbar(true)
//             return;
//         }

//     })

//     PAGES.goto("cyberspace")
// }

// async function loadEvents() {
//     if (FEATURES.tribe_page && (!('tribe_id' in userData) || !userData.tribe_id)) return;
//     return new Promise((resolve, reject) => {
//         clock.clear("events-list")
//         if (hasEventsLoaded) return
//         QUERY.getEvents().then(res => {
//             if (res.status && res.data) {    
//                 event_list_container.innerHTML = ""
//                 let mapTriggered = false;
//                 let liveTriggered = false;
//                 res.data.forEach(event_data => {
//                     const event_name = event_data.name
//                     // const event_countdown = parseCountDown(event_data.start_date, true)
//                     let now = new Date().getTime() > new Date(event_data.start_date).getTime()
//                     const event_date = new Date(event_data.start_date)
//                     const el = cloneEventTemplate(
//                         event_name,
//                         formateDate(event_date),
//                         now
//                     )

//                     const liveEventHandler = () => {
//                         // if (!event_data.priority) return
//                         if (isEventLive(event_data.start_date)) {
//                             if (liveTriggered) return
//                             liveTriggered = true
//                             socketEventLive(userData.uuid, true)
//                             PAGES.goto("live-idle")
//                             setEventCloseButtonsState(!event_data.priority)
//                             showNavbar(false)
//                             resolve(true)
//                         } else if (isIncoming(event_data.start_date)) {
//                             if (mapTriggered) return
//                             mapTriggered = true
//                             openEventMap(event_data)
//                             showNavbar(true)
//                             resolve(true)
//                         }
//                     }
//                     liveEventHandler();

//                     clock.add("cyberspace", () => {
//                         now = new Date().getTime() > new Date(event_data.start_date).getTime()
//                         el.querySelector(".date").innerHTML = now ? "En cours" : formateDate(event_date)
//                         liveEventHandler();
//                     })

//                     el.addEventListener("click", () => {
//                         goto_event(event_data)
//                     })

//                     event_list_container.appendChild(el)
//                 });
//                 hasloaded = true
//                 if (!mapTriggered && !liveTriggered) {
//                     PAGES.goto("cyberspace")
//                     showNavbar(true)
//                 }
//                 resolve(false)
//             }
//         })
//     })
// }

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

// const countdown_days = document.getElementById("countdown-days")
// const countdown_hours = document.getElementById("countdown-hours")
// const countdown_minutes = document.getElementById("countdown-minutes")

// function goto_event(eventData) {
//     if (isNow(eventData.start_date)) {
//         askLastEvent(userData.uuid, true)
//     } else if (isIncoming(eventData.start_date)) {
//         openEventMap(eventData)
//     } else {
//         PAGES.goto("event-countdown")
//         const updateCountdown = () => {
//             const countdown = parseCountDown(eventData.start_date, false)
//             countdown_days.innerHTML = countdown.d
//             countdown_hours.innerHTML = countdown.h
//             countdown_minutes.innerHTML = countdown.m
//         }
//         clock.clear("event-countdown")
//         clock.add("event-countdown", updateCountdown)
//         updateCountdown()
//     }
// }

// function startLiveEventPage() {
//     showNavbar(false)
//     setEventCloseButtonsState(true);
//     PAGES.goto("live-idle")
//     if (USEREVENT.lastEvent) {
//         receiveSessionEvent(USEREVENT.lastEvent);
//     }
//     inside_event = true
// }

// Map
// 

function leafletMap(parent) {
    this.map = L.map(parent).setView([42.71885, 1.83801], 18);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: ''
    }).addTo(this.map);

    const attributionControl = this.map.attributionControl;
    this.map.removeControl(attributionControl);

    this.icon = L.icon({
        iconUrl: document.BASEPATH + '/img/pin.png',
        iconSize:     [32, 32],
        iconAnchor:   [16, 16],
        popupAnchor:  [0, -32] 
    });

    this.updateMap = (evenement) => {
        QUERY.getEventLocation(evenement.id).then(res => {
            if (res.status && res.data) {
                this.SetMapCoords(res.data)
            }
        })
    }

    this.SetMapCoords = (evenement) => {
        this.map.invalidateSize(false);
        if (!evenement.coords) return false;
        
        let popupText = evenement.name;
        const [lat, lon] = evenement.coords; 
        const zoom = 18;
    
        this.map.setView([lat, lon], zoom);
    
        this.map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                this.map.removeLayer(layer);
            }
        });
    
        var p = L.marker([lat, lon], {icon: this.icon}).addTo(this.map).bindPopup(popupText)
        setTimeout(() => {
            p.openPopup();
        }, 700);
    }
}

const map_incoming = new leafletMap("event-location-map");
const map_idle = new leafletMap("live-idle-map");

// var leafletMap = L.map('event-location-map').setView([42.71885, 1.83801], 18);

// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: ''
// }).addTo(leafletMap);

// const attributionControl = leafletMap.attributionControl;
// leafletMap.removeControl(attributionControl);

// var customIcon = L.icon({
//     iconUrl: document.BASEPATH + '/img/pin.png',
//     iconSize:     [32, 32],
//     iconAnchor:   [16, 16],
//     popupAnchor:  [0, -32] 
// });

function openEventMap(evenement) {
    PAGES.goto("event-location")
    map_incoming.updateMap(evenement);

    document.querySelector("#event-location-info .name").innerText = evenement.name
    document.querySelector("#event-location-info .date").innerText = formateDate(new Date(evenement.start_date))
    if (evenement.tribe_id != 0) {
        document.querySelector("#event-location-info .tribe").innerText = "Tribu " + DATA_TRIBES[evenement.tribe_id].name
    } else {
        document.querySelector("#event-location-info .tribe").innerText = ""
    }
}

// function SetMapCoords(evenement) 
// {
//     leafletMap.invalidateSize(false);
//     if (!evenement.coords) return false;
    
//     let popupText = evenement.name;
//     const [lat, lon] = evenement.coords; 
//     const zoom = 18;

//     leafletMap.setView([lat, lon], zoom);

//     leafletMap.eachLayer(function (layer) {
//         if (layer instanceof L.Marker) {
//             leafletMap.removeLayer(layer);
//         }
//     });

//     var p = L.marker([lat, lon], {icon: customIcon}).addTo(leafletMap).bindPopup(popupText)

//     const btn = document.getElementById("event-location-goto");
//     btn.href = "https://maps.google.com/?q="+lat+","+lon+"&z="+zoom;

//     setTimeout(() => {
//         p.openPopup();
//     }, 700);
// }