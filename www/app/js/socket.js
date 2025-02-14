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
    
    document.SOCKETIO.on("trophy_reward", (trophyID) => {
        rewardUserTrophy(trophyID)
    })

    document.SOCKETIO.on("comfygen_done", (path) => {
        console.log("comfygen_done", data)
        userData.avatar = path
        updateProfilePicture()
    })
}

function socketAuth(uuid) {
    document.SOCKETIO.emit('user-auth', uuid);
}

function socketEventLive(uuid) {
    document.SOCKETIO.emit('event-live', uuid);
}

function genNewAvatar(userID, data) {
    document.SOCKETIO.emit("gen-avatar", {userID: userID, data: data})
}