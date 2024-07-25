var NETWORK = {};

var userData = null;
var nextSession = null;

var socket = io();

// MODELS QUERY
//
NETWORK.query = function (name, ...args) {
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

            // Inform server that user is connected
            socket.emit("identify", token)

            //
            // Routing based on user status
            //

            // name is missing
            if (!userData.name) 
                return PAGES.goto("pseudonyme_register");
            
            
            // genjobs are pending or running -> wait !
            if (userData.genjobs.filter((job) => job.status == "pending" || job.status == "running").length > 0) 
                return PAGES.goto("create_avatar_processing"); 

            // no avatar created yet
            if (userData.avatars.length == 0) 
                return PAGES.goto("create_avatar_photo"); 
                                                        
            // no avatar selected
            if (!userData.selected_avatar) 
                return PAGES.selectAvatar(userData.avatars);
            

            // all good
            UTIL.shownav(true);

            // Load next session and offers to register
            NETWORK.query('Session.next')
                .then((id) => {
                    // check if user is already registered from userData
                    nextSession = id;

                    console.log("Sessions User", userData.sessions)

                    // get session from userData.sessions where id = nextSession
                    let session = userData.sessions.filter((s) => s.id == nextSession)[0];
                    
                    if (!session) {
                        console.log("User not registered to next session");
                        PAGES.goto("main");
                        /*
                        // check if user declined to register
                        if (Cookies.get('session_declined_' + nextSession)) {
                            console.log("User declined to register");
                            pages.goto("main");
                            return;
                        }
                        */

                        // Get session details
                        NETWORK.query('Session.get', nextSession)
                            .then((session) => {
                                UTIL.promptForSubscribingEvent(session, nextSession);
                            });
                    }
                    else { 
                        
                        if (!NETWORK.isEventLive) {
                            processEventRouting()
                        }

                        UTIL.getMessages(userData.id, nextSession).then((messages) => {
                            console.log("messages : ",  messages);
                        })
                    }
                })
                .catch((err) => {
                    console.log("No next session found");
                });
        })
        .catch((err) => {
            log('Auth failed.', err);
            Cookies.set('token', "", 30)
            PAGES.goto("home");
        });
}

socket.on('hello', (version) => {
    console.log("Connexion established with server");

    // check server version against cookie
    if (version && version != Cookies.get('version')) {
        console.log("Server version has changed. Reloading page");
        Cookies.set('version', version, 30);
        location.reload();
    } else if (version) {
        console.log("Server version is up to date: ", version);
    }

    NETWORK.loadUser();
});

NETWORK.isEventLive = false
socket.on("getEventState", (state) => {
    if (!userData) return;
    // if (!userData.selected_avatar) return;
    NETWORK.isEventLive = state
    if (state) {
        UTIL.shownav(false);
        PAGES.goto("event-idle");
    } else {
        UTIL.shownav(true);
        processEventRouting();
    }
})

socket.on('disconnect', () => {
    console.log("Disconnected from server");
});

socket.on('reload', () => {
    console.log("Reloading page");
    location.reload();
});

USEREVENT = {}

USEREVENT.promptColors = function(colors, flashing) {
    PAGES.goto("event-color");
    container = document.getElementById("color-selection");
    container.innerHTML = "";
    colors.forEach((color) => {
        const div = document.createElement("div");
        div.style.backgroundColor = color;
        div.addEventListener("click", () => {
            UTIL.showOverlay(true, color, "", false, flashing);
        });
        container.appendChild(div);
    });
}

USEREVENT.promptTexts = function(texts, flashing) {
    PAGES.goto("event-text");
    container = document.getElementById("text-selection");
    container.innerHTML = "";
    texts.forEach((text) => {
        const div = document.createElement("div");
        div.innerHTML = text;   
        div.addEventListener("click", () => {
            UTIL.showOverlay(true, "black", text, false, flashing);
        });
        container.appendChild(div);
    });
}

USEREVENT.promptImages = function(images, flashing) {
    PAGES.goto("event-image");
    container = document.getElementById("image-selection");
    container.innerHTML = "";
    images.forEach((image) => {
        const div = document.createElement("div");
        div.style.backgroundImage = "url("+image+")";
        div.addEventListener("click", () => {
            UTIL.showOverlay(true, "", "", image, flashing);
        });
        container.appendChild(div);
    });
}

USEREVENT.setOverlay = function(type, args, params) {

    const flashing = params.flash || false;
    const randomSelect = params.random || false;
    const switchonclick = params.loop || false;

    const shuffledArgs = args.sort(() => Math.random() - 0.5);

    const show = (val) => {
        switch (type) {
            case "color":
                UTIL.showOverlay(true, val, "", false, flashing);
                break;
            case "text":
                UTIL.showOverlay(true, "black", val, false, flashing);
                break;
            case "image":
                UTIL.showOverlay(true, "black", "", val, flashing);
                break;
        }
    }

    const rndID = () => {
        const args_len = shuffledArgs.length;
        return Math.floor(Math.random()*args_len);
    }

    let id = rndID();

    if (args.length>1) {
        if (randomSelect) {
            show(shuffledArgs[id]);
        } else {
            switch(type) {
                case "color":
                    USEREVENT.promptColors(shuffledArgs, flashing);
                    break;
                case "text":
                    USEREVENT.promptTexts(shuffledArgs, flashing);
                    break;
                case "image":
                    USEREVENT.promptImages(shuffledArgs, flashing);
                    break;
            }
        }
    } else {
        show(shuffledArgs[0]);
    }

    if (switchonclick) {
        document.getElementById("overlay").onclick = function() {
            id = (id + 1) % shuffledArgs.length;
            show(shuffledArgs[id]);
        };
    }
}

NETWORK.rotateSchedule = false;
NETWORK.receiveSessionEvent = function (event) {
    document.getElementById("overlay").onclick = null;
    clearInterval(NETWORK.rotateSchedule);
    if (!NETWORK.isEventLive) return;
    UTIL.showOverlay(false);
    let container;
    switch (event.name) {
        case "color":
            USEREVENT.setOverlay(event.name, event.args.colors, event.args.params);
            break;
        case "text":
            USEREVENT.setOverlay(event.name, event.args.texts, event.args.params);
            break;
        case "image":
            USEREVENT.setOverlay(event.name, event.args.images, event.args.params);
            break;
        case "info":
            PAGES.goto("event-info");
            UTIL.showOverlay(false);
            document.getElementById("event-info-message").innerHTML = event.args.message; 
            break;
    }
}

socket.on('start-event', NETWORK.receiveSessionEvent);
socket.on('end-event', () => {
    UTIL.showOverlay(false);
    clearInterval(NETWORK.rotateSchedule);
    PAGES.goto("event-idle");
});

// Chat message

socket.on("new_chatMessage", (msg, emit_time) => {
    // UTIL.displayUnreadMessages([{emit_time: emit_time, message: msg}]);
    // UTIL.addNotification(new Date(emit_time).toLocaleString(), msg);
    // NETWORK.query("User.setLastRead", userData.id, emit_time)
    UTIL.getMessages(userData.id, nextSession).then((messages) => {
        console.log("messages : ",  messages);
    })
})

// Version
