var NETWORK = {};

var userData = null;
var nextSession = null;

var socket = io();

// MODELS QUERY
//
NETWORK.query = function (name, args) {
    var resid = Math.random().toString(36).substring(2);
    socket.emit('query', {
        name: name,
        args: args,
        resid: resid
    });
    var p = new Promise((resolve, reject) => {
        socket.once('ok-' + resid, (data) => { resolve(data) })
        socket.once('ko-' + resid, (data) => { reject(data) })
    })
    return p
}

NETWORK.requestAvatar = async function () {
    return new Promise((resolve, reject) => {
        NETWORK.query("Avatar.new", { user_id: userData.id, url: "https://picsum.photos/256/256" }).then((data) => {
            resolve(data);
        });
    });
}

NETWORK.loadUser = function () {

    // Load USER from UUID token
    const token = Cookies.get('token');
    console.log("User token :", token)
    // console.log("User token :", token)

    NETWORK.query('User.getfull', { uuid: token })
        .then((data) => {
            userData = data;

            log('User loaded', data);
            // log('auth successful.');

            socket.emit("identify",token)

            // Routing based on user status
            //
            if (!userData.name) {                       // name is missing
                PAGES.goto("pseudonyme_register");
            } else if (userData.genjobs.length > 0) {
                PAGES.goto("create_avatar_processing");
            }
            else if (userData.avatars.length == 0) {    // avatars are missing
                PAGES.goto("create_avatar_photo");
            }
            // no avatar selected
            else if (!userData.selected_avatar) {
                PAGES.selectAvatar(userData.avatars);
            }
            else {
                PAGES.goto("main");          // profile page
                UTIL.shownav(true);

                // Load next session and offers to register
                NETWORK.query('Session.next')
                    .then((id) => {
                        // check if user is already registered from userData
                        nextSession = id;

                        if (!userData.sessions.map((s) => s.id).includes(nextSession)) {
                            console.log("User not registered to next session");

                            // check if user declined to register
                            if (Cookies.get('session_declined_' + nextSession)) {
                                console.log("User declined to register");
                                pages.goto("main");
                                return;
                            }

                            // Get session details
                            NETWORK.query('Session.get', nextSession)
                                .then((session) => {
                                    UTIL.promptForSubscribingEvent(session, nextSession);
                                });
                        }
                    })
                    .catch((err) => {
                        console.log("No next session found");
                    });
            }

        })
        .catch((err) => {
            log('Auth failed.', err);
            Cookies.set('token', "", 30)
            PAGES.goto("home");
        });
}

socket.on('hello', () => {
    console.log("Connexion established with server");

    NETWORK.loadUser();


        // console.log(Cookies.get('token'))
        


});

NETWORK.receiveSessionEvent = function (event) {
    if (!isEventActive()) return;
    console.log("Received event", event);
    let container;
    switch (event.name) {
        case "color":
            PAGES.goto("event-color");
            container = document.getElementById("color-selection");
            container.innerHTML = "";
            event.args.forEach((color) => {
                const div = document.createElement("div");
                div.style.backgroundColor = color;
                div.addEventListener("click", () => {
                    UTIL.showOverlay(true, color, "");
                });
                container.appendChild(div);
            });
            break;
        case "text":
            PAGES.goto("event-text");
            container = document.getElementById("text-selection");
            container.innerHTML = "";
            event.args.forEach((text) => {
                const div = document.createElement("div");
                div.innerHTML = text;
                div.addEventListener("click", () => {
                    UTIL.showOverlay(true, "black", text);
                });
                container.appendChild(div);
            });
            break;
        case "flash":
            PAGES.goto("event-flash");
            break;
    }
}

socket.on('start-event', NETWORK.receiveSessionEvent);
socket.on('end-event', () => {
    PAGES.goto("main");
    UTIL.showOverlay(false);
});

