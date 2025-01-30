var socket = io();
socket.connected = false;

socket.on('connect', () => {
    console.log('Connected');
    socket.connected = true;
});

function socketAuth(uuid) {
    socket.emit('user-auth', uuid);
}

function socketEventLive(uuid) {
    socket.emit('event-live', uuid);
}

socket.on("trophy_reward", (trophyID) => {
    console.log("trophy_reward", trophyID);
    if (!userData) return;
    userData.trophies.push(trophyID);
    updateTrophiesState()
})