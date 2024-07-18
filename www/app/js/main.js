const DEBUGS = {
    pwaBypass: true
}

// Render rounded graphics
//

const renderer = new roundedGraphics(document.getElementById("background"), 1);
document.querySelectorAll(".illustration").forEach(illustration => renderer.addElement(illustration));
document.querySelectorAll("button").forEach(button => renderer.addElement(button));
renderer.updateColor(getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim());
renderer.updateBackgroundColor(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());

renderer.updatePixelSize({ x: window.innerWidth, y: window.innerHeight });

let sin=0;
setInterval(() => {
    sin+=0.01;
    const val = (Math.sin(sin) + 1) / 2;
    renderer.updatePixelSize({ x: Math.ceil(window.innerWidth * val), y: Math.ceil(window.innerHeight * val) });
}, 10);
renderer.render();

// Glitched elements
//
const glitch_elements = []
document.querySelectorAll("button").forEach(button => glitch_elements.push(button));

async function glitchOffset(element, original) {
    const offsetX = Math.floor(Math.random() * 20) - 10;
    const offsetY = Math.floor(Math.random() * 20) - 10;
    if (original == `translate(0, 0)`) {
        element.style.transform = `translate(${offsetX}px, ${offsetY}px)`
    } else {
        const originalvalues = original.split("translate(")[1].split(")")[0].split(",");
        const originalX = originalvalues[0];
        const originalY = originalvalues[1];

        element.style.transform = `translate(calc( ${originalX} + ${offsetX}px ), calc( ${originalY} + ${offsetY}px))`
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    element.style.transform = original
    const randomWait = Math.floor(Math.random() * 5000) + 500;
    await new Promise(resolve => setTimeout(resolve, randomWait));
    glitchOffset(element, original);
}

function glitchElementInit(element) {
    const style = element.style.transform;
    let original = style ? style : `translate(0, 0)`
    glitchOffset(element, original);
}

glitch_elements.forEach(element => {
    glitchElementInit(element);
});

// LOG
//
function log(...msg) {
    console.log(...msg)
}

// Utilities
//

let UTIL = {};

UTIL.alert = function(message) {
    alert(message);
};

UTIL.registerServiceWorker = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./js/sw.js')
        .then(function(reg) {
            console.log('Service Worker registered with scope: ', reg.scope);
        })
        .catch(function(err) {
            console.log('Service Worker registration failed: ', err);
        });
    }
};

UTIL.registerServiceWorker();

UTIL.isPWACompatible = function() {
    return ('serviceWorker' in navigator);
}

UTIL.promptPWAInstall = function() {
    if (UTIL.isPWACompatible()) {
        if (!window.chrome) {
            // UTIL.alert("This browser is not Chromium-based");
        }
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); // Prevent the default prompt
            this.alert("Install this app?"); // Show a custom prompt
            e.prompt(); // Trigger the installation prompt
        });
    }
}

UTIL.promptPWAInstall();

UTIL.normalizePhone = function(phone) {
    phone = phone.replace(/ /g, '');
    if (phone[0] === '+') phone = '0' + phone.substring(3);
    return phone;
  }
  

UTIL.isPhoneNumberValid = function (str) {
    str = UTIL.normalizePhone(str);
    if (str[0] != '0') return false;
    for (let i = 1; i < str.length; i++) {
        if (isNaN(str[i])) return false;
    }
    if (str.length != 10) return false;
    
    return true;
}

UTIL.shownav = function(bool) {
    if (!bool) document.body.classList.add("navhidden");
    else document.body.classList.remove("navhidden");
}
UTIL.shownav(false);

UTIL.showOverlay = function(bool, color, message, image = false, flashing = false) {
    const overlay = document.getElementById("overlay");
    overlay.classList.remove("flashing");
    if (bool) {
        overlay.classList.add("active");
        if (flashing) overlay.classList.add("flashing");
        overlay.style.backgroundColor = color;
        overlay.innerHTML = message;

        if (image) {
            overlay.innerHTML = `<img src="${image}">`;
        }
    } else {
        overlay.classList.remove("active");
    }
}

const notif_template = document.getElementById("notif-template");
UTIL.addNotification = function(date,message) {
    const notif = notif_template.content.cloneNode(true);
    notif.querySelector(".bold").innerText = message;
    notif.querySelector(".light").innerText = date;
    document.getElementById("notifications").appendChild(notif);
}

UTIL.countDownInterval = false;
UTIL.setCoundDown = function(date, time) {

    document.getElementById("nextevent-date").innerHTML = date;
    document.getElementById("nextevent-time").innerHTML = time;

    const days = document.getElementById("label-countdown-days");
    const hours = document.getElementById("label-countdown-hours");
    const minutes = document.getElementById("label-countdown-minutes");

    const countDownDateTime = new Date(date + ' ' + time).getTime();

    const updateCountDown = () => {
        const now = new Date().getTime();
        const distance = countDownDateTime - now;
        days.innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        hours.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutes.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    }
    
    clearInterval(UTIL.countDownInterval);
    updateCountDown();
    UTIL.countDownInterval = setInterval(() => {
        updateCountDown();
    }, 1000);
}

UTIL.countDown = function(countDownDateTime) {
    const now = new Date().getTime();
    const distance = new Date(countDownDateTime).getTime() - now;
    return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    }
}

UTIL.clearIncomingEvents = function() {
    document.getElementById("event-list").innerHTML = "";   
}

UTIL.addIncomingEvent = function(evenement) {
    const eventDom = document.getElementById("event-list-item").cloneNode(true).content.querySelector(".event-list-item");
    eventDom.querySelector(".event-list-item-title").innerText = evenement.name;
    const countDown = UTIL.countDown(evenement.starting_at);
    eventDom.querySelector(".event-list-item-date").innerText = countDown.days + "d " + countDown.hours + "h " + countDown.minutes + "m";
    
    renderer.addElement(eventDom);
    glitchElementInit(eventDom);

    document.getElementById("event-list").appendChild(eventDom);
    
    eventDom.addEventListener("click", () => {
        PAGES.goto("event-countdown");

        UTIL.setCoundDown(...evenement.starting_at.split("T"));
    });
}

UTIL.getMessages = async function(user_id, session_id) {
    return new Promise(async (resolve, reject) => {
        // const messages = await NETWORK.query('Message.list', {user_id: user_id, session_id: session_id});
        const messages = await NETWORK.query("User.getMessages", user_id, session_id);
        console.log(messages);
        resolve(messages);
    })
}

UTIL.displayUnreadMessages = function(messages) {
    const unreadOverlay = document.getElementById("unread-notifications-container");
    unreadOverlay.classList.remove("hidden");
    messages.forEach(message => {
        const notif = document.getElementById("unread-notification-template").cloneNode(true).content.querySelector(".unread-notification");
        notif.querySelector(".unread-notification-content").innerHTML = message.message;

        unreadOverlay.appendChild(notif);

        notif.querySelector(".close").addEventListener("click", () => {
            UTIL.readMessage(message.emit_time);
            notif.remove();
            if (unreadOverlay.childElementCount == 0) unreadOverlay.classList.add("hidden");
        })
    })
}

UTIL.readMessage = function(time) {
    console.log(time);
}

// Cookies
//

Cookies = {
    get: function(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    },
    set: function(name, value, days) {
        var d = new Date;
        d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
        document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
    },
    str: function() {
        return document.cookie;
    }
};

// Pages
//

let PAGES = {
    class: "page"
};

PAGES.all = function() {
    return document.getElementsByClassName(PAGES.class);
};

PAGES.active = function() {
    let pages = PAGES.all();
    for (let i = 0; i < pages.length; i++) {
        if (pages[i].classList.contains("active")) {
            return pages[i];
        }
    }
}

PAGES.next = function() {
    let pages = PAGES.all();
    for (let i = 0; i < pages.length; i++) {
        if (pages[i].classList.contains("active")) {
            let id;
            if (i < pages.length - 1) {
                id = pages[i + 1].dataset.pageId
            } else {
                id = pages[0].dataset.pageId
            };
            console.log(id);
            PAGES.goto(id);
            return;
        }
    }
}

PAGES.callbacks = {};

PAGES.addCallback = function(pageID, callback) {
    PAGES.callbacks[pageID] = callback;
}

PAGES.callback = function(page) {
    if (PAGES.callbacks[page]) PAGES.callbacks[page]();
}

PAGES.goto = function(pageID) {
    const page = document.querySelector(`.page[data-page-id="${pageID}"]`);
    if (!page) UTIL.alert(`Page with ID "${pageID}" not found`);

    PAGES.active().classList.remove("active");
    page.classList.add("active");

    PAGES.callback(pageID);
}

PAGES.random = function(...routes) {
    let index = Math.floor(Math.random() * routes.length);
    PAGES.goto(routes[index]);
}
    
PAGES.home = function() { PAGES.goto("home"); };

// Initialize the application
//

document.addEventListener("DOMContentLoaded", function() {
    if (!UTIL.isPWACompatible()) {
        if (!DEBUGS.pwaBypass) PAGES.goto("unsupported");
        return;
    }
});

// Leaflet map
//

var leafletMap = L.map('coords-map').setView([51.505, -0.09], 13);

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; Stadia Maps'
}).addTo(leafletMap);

const attributionControl = leafletMap.attributionControl;
leafletMap.removeControl(attributionControl);

PAGES.addCallback("event-location", function() {
    leafletMap.invalidateSize(false);
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

UTIL.setMapCoords = function(lat, lon, popupText) {
    leafletMap.setView([lat, lon], 13);
    leafletMap.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            leafletMap.removeLayer(layer);
        }
    });
    L.marker([lat, lon], {icon: customIcon}).addTo(leafletMap).bindPopup(popupText).openPopup();
}

UTIL.getCssRootVar = function(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

UTIL.generateShareLink = function(link) {
    document.getElementById("qr-code").innerHTML = "";
    let qrcode = new QRCode("qr-code", {
        text: link,
        width: 512,
        height: 512,
        colorDark : UTIL.getCssRootVar("--color-primary"),
        colorLight : UTIL.getCssRootVar("--color-background"),
        correctLevel : QRCode.CorrectLevel.H
    });

    document.getElementById("copylink").onclick = function() {
        navigator.clipboard.writeText(link);
    }
}

UTIL.promptForSubscribingEvent = function(evenement) {
    PAGES.goto("event-subscribe-prompt");
    const eventname_label = document.getElementById("subscribe-label-event");
    const confirm_button = document.getElementById("subscribe-confirm");
    const decline_button = document.getElementById("subscribe-decline");

    eventname_label.innerText = evenement.name;

    confirm_button.onclick = function() {
        NETWORK.query('User.register', [userData.uuid, evenement.id]).then(()=>{
            NETWORK.loadUser();
            PAGES.goto("event-countdown");
        }).catch((err)=>{
            NETWORK.loadUser();
            PAGES.goto("event-countdown");
        });
    }

    decline_button.onclick = function() {
        Cookies.set('session_declined_'+evenement.id, true, 30);
        PAGES.goto("event-countdown");
    }
}

// Debug
PAGES.addCallback("share_link", function() { 
    UTIL.generateShareLink("https://www.google.com");
});