if (window.location.host == "contest.kxkm.net" || window.location.host.includes('localhost')) {
    // add border to body
    document.body.style.border = "3px solid yellow";
}

const DEBUGS = {
    pwaBypass: true
}

// Fullscreen toggle button
//

const fullscreen_btn = document.getElementById("toggle_fullscreen");

fullscreen_btn.addEventListener("click", () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
});

function showFullScreenButton(bool) {
    if (bool) {
        fullscreen_btn.style.display = "flex";
    } else {
        fullscreen_btn.style.display = "none";
    }
}

// Render rounded graphics
//

const renderer = new roundedGraphics(document.getElementById("background"), {x: window.innerWidth, y: window.innerHeight});

// Add elements here
const elements_to_render = [".illustration", "button", "h1"];
document.querySelectorAll(elements_to_render.join(",")).forEach(elm => renderer.addElement(elm));

renderer.updateColor(getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim());
renderer.updateBackgroundColor(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());

renderer.updatePixelSize({ x: window.innerWidth, y: window.innerHeight });

var PIX_PERIOD = 4000   // Sinus period in ms
var PIX_GAIN = 2        // Sinus will go from 0 to PIX_GAIN. Values over 1 will be clamped to 1 => Higher PIX_GAIN = longer "stable" period

lastUpdate = 0;
function updateCanvasRender() {
    const t = performance.now();
    
    if (lastUpdate > t%PIX_PERIOD) {
        if (userData && userData.selected_avatar) { 
            document.querySelectorAll(".maskSwitch").forEach(mask => {
                // console.log(mask.src)
                if (mask.src.includes("mask.png")) {
                    mask.src = userData.selected_avatar.url
                } else {
                    mask.src = "./img/mask.png"
                }
            });
        }
    }

    lastUpdate = t%PIX_PERIOD;

    var val = PIX_GAIN * (Math.sin((t * Math.PI)*2/PIX_PERIOD + Math.PI*1.5) + 1) / 2;
    if (val > 1) val = 1 
    renderer.updatePixelSize({ x: Math.ceil(window.innerWidth * val), y: Math.ceil(window.innerHeight * val) });
    requestAnimationFrame(updateCanvasRender);
}
updateCanvasRender();
renderer.render();

// MaskSwitch -> go to avatar
document.querySelectorAll(".maskSwitch").forEach(mask => {
    mask.addEventListener("click", () => {
        PAGES.goto('mon_avatar')
    });
});

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
    notif.querySelector(".bold").innerHTML =  message.split("\n")[0]
    notif.querySelector(".light").innerText = date;

    notif.querySelector(".notification").addEventListener("click", () => {
        UTIL.displayUnreadMessages([{emit_time: new Date(date).getMilliseconds(), message: message}]);
    })

    document.getElementById("notifications").appendChild(notif);
}

UTIL.countDownInterval = false;
UTIL.setCountDown = function(evenement) {

    document.getElementById("nextevent-name").innerHTML = evenement.name;
    document.getElementById("nextevent-date").innerHTML = UTIL.dateTime(evenement.starting_at);

    const days = document.getElementById("label-countdown-days");
    const hours = document.getElementById("label-countdown-hours");
    const minutes = document.getElementById("label-countdown-minutes");

    const countDownDateTime = new Date(evenement.starting_at).getTime();

    const updateCountDown = () => {
        const now = new Date().getTime();
        const distance = countDownDateTime - now;
        days.innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        hours.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutes.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        if (distance < 1000 * 60 * 60) {
            // if (PAGES.active().dataset.pageId=="event-countdown") window.location.reload();
        }
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

UTIL.dateTime = function(datetime, short=false) {
    const dayName = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const monthName = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const date = new Date(datetime);

    if (short) return dayName[date.getDay()] + " " + date.getDate() + ", " + date.toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'});
    else return dayName[date.getDay()] + " " + date.getDate() + " " + monthName[date.getMonth()] + " à " + date.toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'});
    //date.toLocaleDateString() + " à " + date.toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'});
}

UTIL.clearIncomingEvents = function() {
    document.getElementById("event-list").innerHTML = "";   
}

UTIL.selectedEvent = null;
UTIL.addIncomingEvent = function(evenement) {
    const eventDom = document.getElementById("event-list-item").cloneNode(true).content.querySelector(".event-list-item");
    eventDom.querySelector(".event-list-item-title").innerText = evenement.name;


    const now = new Date();
    const start = new Date(evenement.starting_at);
    const diff = start - now;
    const one_hour = 60 * 60 * 1000;

    const is_event_in_an_hour = diff > 0 && diff < one_hour; 
    const is_event_live = diff < 0;

    // If the event is in an hour
    if (is_event_live) {
        eventDom.querySelector(".event-list-item-date").innerText = "EN COURS";
    } else {
        eventDom.querySelector(".event-list-item-date").innerText = UTIL.dateTime(evenement.starting_at, true);
    }

    renderer.addElement(eventDom);
    glitchElementInit(eventDom);

    document.getElementById("event-list").appendChild(eventDom);
    
    eventDom.addEventListener("click", () => {
        UTIL.selectedEvent = evenement;
        if (is_event_live && NETWORK.isEventLive) {
            PAGES.goto("event-idle");
        } else if (is_event_live || is_event_in_an_hour) { 
            PAGES.goto("event-location");    
        } else {
            PAGES.goto("event-countdown");
        }
    });
}

UTIL.getMessages = async function(user_id, session_id) {
    return new Promise(async (resolve, reject) => {
        const messages = await NETWORK.query("User.getMessages", user_id, session_id);
        document.getElementById("notifications").innerHTML = "";
        if (messages.length==0) return resolve([]); 

        let firstTime = userData.last_read ? false : true
        lastTimeRead = userData.last_read ? userData.last_read : 0;

        let unread_messages = [];
        messages.forEach(message => {
            UTIL.addNotification(new Date(message.emit_time).toLocaleString(), message.message);
            
            if (!firstTime && message.emit_time > lastTimeRead) {
                unread_messages.push(message);
            }
        })

        if (firstTime) {
            const msgs = messages.sort((a, b) => b.emit_time - a.emit_time);
            unread_messages.push(msgs[msgs.length-1]);
            if (msgs.length>1) {
                unread_messages.push(msgs[0]);
            }
        }

        const mostRecentTime = messages.sort((a, b) => b.emit_time - a.emit_time)[0].emit_time;
        
        if (mostRecentTime > lastTimeRead) {
            NETWORK.query("User.setLastRead", user_id, mostRecentTime).then(() => {   
                userData.last_read = mostRecentTime;  
                if (unread_messages.length > 0) UTIL.displayUnreadMessages(unread_messages);
                resolve(messages);
            });
        }
    })
}

UTIL.displayUnreadMessages = function(messages) {
    const unreadOverlay = document.getElementById("unread-notifications-container");
    unreadOverlay.classList.remove("hidden");
    messages.forEach(message => {
        const notif = document.getElementById("unread-notification-template").cloneNode(true).content.querySelector(".unread-notification");
        notif.querySelector(".unread-notification-content").innerHTML = message.message.replace(/\n/g, "<br>");

        unreadOverlay.appendChild(notif);

        notif.addEventListener("click", () => {
            notif.remove();
            if (unreadOverlay.childElementCount == 0) unreadOverlay.classList.add("hidden");
        })
    })
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

    // save nav history (except for create_avatar and register pages)
    if (!pageID.startsWith("create_avatar") && !pageID.includes("_register"))
        history.pushState({pageID: pageID}, "", "");

    PAGES.callback(pageID);
}

// Call history on back
addEventListener("popstate", (event) => {
    if (!event.state) return;
    PAGES.goto(event.state.pageID);
});

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

UTIL.getCssRootVar = function(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

UTIL.generateShareLink = function(link) {
    /*
    document.getElementById("qr-code").innerHTML = "";
    let qrcode = new QRCode("qr-code", {
        text: link,
        width: 512,
        height: 512,
        colorDark : UTIL.getCssRootVar("--color-primary"),
        colorLight : UTIL.getCssRootVar("--color-background"),
        correctLevel : QRCode.CorrectLevel.H
    })

    console.log(qrcode)

    document.getElementById("copylink").onclick = function() {
        navigator.clipboard.writeText(link);
    }

    qrcode._oDrawing._elCanvas.style.display = "none";
    qrcode._oDrawing._elImage.dataset.rendererRotate = "0";
    renderer.addElement(qrcode._oDrawing._elImage);
    */
}

UTIL.promptForSubscribingEvent = function(evenement) {
    PAGES.goto("event-subscribe-prompt");
    const eventname_label = document.getElementById("subscribe-label-event");
    const confirm_button = document.getElementById("subscribe-confirm");
    const decline_button = document.getElementById("subscribe-decline");

    eventname_label.innerText = evenement.name;

    confirm_button.onclick = function() {
        NETWORK.query('User.register', userData.uuid, evenement.id)
            .then(()=>{}).catch((err)=>{})
            .finally(() => { location.reload() })
    }   

    decline_button.onclick = function() {
        Cookies.set('session_declined_'+evenement.id, true, 30);
        processEventRouting();
    }
}

// Debug
PAGES.addCallback("share_link", function() { 
    UTIL.generateShareLink("https://contacts.kxkm.net");
});

// Messages scroll down
PAGES.addCallback("notifications", function() {
    document.getElementById("notifications").scrollTop = document.getElementById("notifications").scrollHeight;
    console.log("scrolling");
});

// Nosleep

var noSleep = new NoSleep();
document.addEventListener('click', function enableNoSleep() {
    document.removeEventListener('click', enableNoSleep, false);
    noSleep.enable();
  }, false);