var NETWORK = {};

var userData = null;
var socket = io();

NETWORK.register = function (data) {
    socket.emit('register', data);
}

socket.on('register', (data) => {
    if (data) {
        console.log("Registration successful:", data);
        Cookies.set('token', data, 30)
        PAGES.goto("main");
    } else {
        UTIL.alert("Registration failed");
    }
});

socket.on('hello', () => {
    console.log("Connexion established with server");

    const token = Cookies.get('token');
    if (token) {
        console.log("User token :", token)
        socket.emit('auth', token);
    } else {
        PAGES.goto("home");
    }
});

socket.on('auth', (data) => {
    if (data) {
        console.log('auth successful, checking for event...');
        userData = data;
        socket.emit("event?");
    } else {
        console.log('auth failed');
    }
});

socket.on('event?', (data) => {
    if (data) {
        console.log(data);
    } else {
        console.log('no event');
    }

    PAGES.goto("main");
});