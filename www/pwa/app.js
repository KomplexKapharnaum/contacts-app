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

UTILS.subscribeToPush = async function() {
    const response = await fetch("/vapidPublicKey");
    const vapidPublicKey = await response.text();
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(async function(reg) {
            // Check if there is an active subscription
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
                // If there is an active subscription, unsubscribe
                await subscription.unsubscribe();
            }
            // Subscribe with the new applicationServerKey
            return reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
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
    const subscription = await UTILS.subscribeToPush();
    console.log(subscription);
    fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
            "content-type": "application/json"
        }
    });
});