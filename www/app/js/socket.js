// Connect Socketio (if not already exists)
if (!document.SOCKETIO) 
{
    document.SOCKETIO = io(document.WEBAPP_URL)
    document.SOCKETIO.connected = false;

    document.SOCKETIO.on('connect', function () {
        console.log('SOCKETIO: Connected to server');
        document.SOCKETIO.connected = 1;
    });
    document.SOCKETIO.on('disconnect', function () {
        console.log('SOCKETIO: Disconnected from server');
        document.SOCKETIO.connected = 0;
    });
}

document.SOCKETIO.on("trophy_reward", (trophyID) => {
    rewardUserTrophy(trophyID)
})

document.SOCKETIO.on("comfygen_done", (path) => {
    console.log("comfygen_done", path)
    userData.avatar = path
    updateProfilePicture()
})

document.SOCKETIO.on("update_avatar", (path) => {
    console.log("update_avatar", path)
    userData.avatar = path
    updateProfilePicture()
})

document.SOCKETIO.on("rate-limited", (timeRemaining) => {
    alert("You are being rate limited, please wait " + Math.ceil(timeRemaining) + " seconds before sending another message.");
})


function socketAuth(uuid) {
    document.SOCKETIO.emit('user-auth', uuid);
}

function socketEventLive(uuid, join) {
    document.SOCKETIO.emit('event-live', {uuid, join});
}

// Monkey patch (missing launcher events)
function socketHasEvent(eventName) { return (document.SOCKETIO.listeners(eventName).length > 0) }
if (!socketHasEvent("forceupdate") && window.localStorage) {
    document.SOCKETIO.on("forceupdate", () => forceupdate())
}
