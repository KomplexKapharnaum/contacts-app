// Render rounded graphics
//

const test = new roundedGraphics(document.getElementById("background"), 5);
document.querySelectorAll(".illustration").forEach(illustration => test.addElement(illustration));
test.updateColor(getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
test.render();

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

UTIL.showOverlay = function(bool, color, message) {
    const overlay = document.getElementById("overlay");
    if (bool) {
        overlay.classList.add("active");
        overlay.style.backgroundColor = color;
        overlay.innerHTML = message;
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
    const days = document.getElementById("label-countdown-days");
    const hours = document.getElementById("label-countdown-hours");
    const minutes = document.getElementById("label-countdown-minutes");

    const countDownDateTime = new Date(date + ' ' + time).getTime();
    UTIL.countDownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = countDownDateTime - now;
        days.innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        hours.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutes.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    }, 1000);
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
        PAGES.goto("unsupported");
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

// Debug
PAGES.addCallback("share_link", function() { 
    UTIL.generateShareLink("https://www.google.com");
});