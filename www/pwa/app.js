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

var uuid = Cookies.get('userid') || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
Cookies.set('userid', uuid, { expires: 3700 })

var socket = io();
socket.on('hello', function() {
    console.log("sending uuid", uuid)
    socket.emit('uuid', uuid);
});

let UTILS = {};

UTILS.requestNotificationPermission = function(callback) {
    Notification.requestPermission(function(result) {
        if (result === 'granted') {
            callback();
        }
    });
};

UTILS.displayNotification = function(title, options) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(function(reg) {
            alert("Notification permission granted")
            reg.showNotification(title, options);
        });
    }
};

UTILS.registerServiceWorker = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/pwa/sw.js')
        .then(function(reg) {
            console.log('Service Worker registered with scope: ', reg.scope);
        })
        .catch(function(err) {
            console.log('Service Worker registration failed: ', err);
        });
    }
};

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

UTILS.subscribeToPush = async function(callback) {
    const response = await fetch("/vapidPublicKey");
    const vapidPublicKey = await response.text();
    console.log("vapidPublicKey", vapidPublicKey)
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/pwa/sw.js').then(async function(reg) {

            // let reg = await navigator.serviceWorker.ready;

            // Check if there is an active subscription
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
                // If there is an active subscription, unsubscribe
                await subscription.unsubscribe();
            }
    
            console.log("subscribing...")
            // Subscribe with the new applicationServerKey
            reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            }).then((subscription) => callback(subscription))

        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    }
}

UTILS.registerServiceWorker();

document.addEventListener('click', function() {
    UTILS.requestNotificationPermission(function() {
        /*UTILS.displayNotification('Hello from PWA', {
            body: 'Notification from PWA'
        });*/
    });
});

document.getElementById("subscribe").addEventListener("click", async function() {
    await UTILS.subscribeToPush((subscription) => {
        console.log(subscription);
        fetch("/sub", {
            method: "POST",
            body: JSON.stringify(subscription),
            headers: {
                "content-type": "application/json"
            }
        });
    });
});