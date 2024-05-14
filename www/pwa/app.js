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
            console.log('Service Worker Registered!', reg);
            return reg.pushManager.getSubscription().then(function(sub) {
                if (sub) {
                    return sub;
                }
                return reg.pushManager.subscribe({
                    userVisibleOnly: true
                });
            });
        })
        .catch(function(err) {
            console.log('Service Worker registration failed: ', err);
        });
    }
};

UTILS.registerServiceWorker();

document.addEventListener('click', function() {
    UTILS.requestNotificationPermission(function() {
        UTILS.displayNotification('Hello from PWA', {
            body: 'Notification from PWA'
        });
    });
});