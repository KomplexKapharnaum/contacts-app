function registerNotification() {
    if (!navigator.serviceWorker){
        return console.error("Service Worker not supported")
    }

    console.log("Registering notification")
    
    Notification.requestPermission(permission => {
        if (permission === 'granted'){ 
            registerBackgroundSync() 
            new Notification("Liste de trucs à faire", {
                body: "N'oublie pas de faire les courses !"
            })
        }
        else console.error("Permission was not granted.")
    })
}

function registerBackgroundSync() {
    if (!navigator.serviceWorker){
        return console.error("Service Worker not supported")
    }

    navigator.serviceWorker.ready
    .then(registration => registration.sync.register('syncAttendees'))
    .then(() => console.log("Registered background sync"))
    .catch(err => console.error("Error registering background sync", err))
}


self.addEventListener('sync', function(event) {
	console.log("sync event", event);
    if (event.tag === 'syncAttendees') {
        event.waitUntil(syncAttendees()); // sending sync request
    }
});

function syncAttendees(){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 10000);
    }).then(() => {
        self.registration.showNotification("Hello world !");
    });
}
