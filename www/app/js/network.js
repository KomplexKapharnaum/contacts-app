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
                    
                    UTIL.getMessages(userData.id, nextSession).then((messages) => {
                        console.log("messages : ",  messages);
                    })
                    
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
                    else { processEventRouting() }
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

socket.on('hello', () => {
    console.log("Connexion established with server");
    NETWORK.loadUser();
});

socket.on('disconnect', () => {
    console.log("Disconnected from server");
});

socket.on('reload', () => {
    console.log("Reloading page");
    location.reload();
});

NETWORK.receiveSessionEvent = function (event) {
    if (!isEventActive()) return;
    let container;
    switch (event.name) {
        case "color" :
            (() => {
                const colors = event.args.colors;
                const flashing = event.args.params.flash;
                const randomSelect = event.args.params.random;
                
                if (colors.length==1) {
                    UTIL.showOverlay(true, colors[0], "", flashing);
                    return;
                }

                if (randomSelect) {
                    UTIL.showOverlay(true, colors[Math.floor(Math.random()*colors.length)], "", false, flashing);
                    return;
                }

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
            })()
            break;
        case "text" :
            (() => {
                const texts = event.args.texts;
                const randomSelect = event.args.params.random;

                if (texts.length==1) {
                    UTIL.showOverlay(true, "black", texts[0]);
                    return;
                }

                if (randomSelect) {
                    UTIL.showOverlay(true, texts[Math.floor(Math.random()*texts.length)], "");
                    return;
                }

                PAGES.goto("event-text");
                container = document.getElementById("text-selection");
                container.innerHTML = "";
                texts.forEach((text) => {
                    const div = document.createElement("div");
                    div.innerHTML = text;   
                    div.addEventListener("click", () => {
                        UTIL.showOverlay(true, "black", text);
                    });
                    container.appendChild(div);
                });
            })();
            break;
        case "image" :
            (()=>{
                const images = event.args.images;
                const randomSelect = event.args.params.random;

                if (images.length==1) {
                    UTIL.showOverlay(true, "", "",images[0]);
                    return;
                }

                if (randomSelect) {
                    UTIL.showOverlay(true, "", "",images[Math.floor(Math.random()*images.length)]);
                    return;
                }

                PAGES.goto("event-image");
                container = document.getElementById("image-selection");
                container.innerHTML = "";
                images.forEach((image) => {
                    const div = document.createElement("div");
                    div.style.backgroundImage = "url("+image+")";
                    div.addEventListener("click", () => {
                        UTIL.showOverlay(true, "", "",image);
                    });
                    container.appendChild(div);
                });
            })();
            break;
        case "info":
            PAGES.goto("event-info");
            UTIL.showOverlay(false);
            document.getElementById("event-info-message").innerHTML = event.args.message; 
            break;
        case "flash":
            PAGES.goto("event-flash");
            break;
    }
}

socket.on('start-event', NETWORK.receiveSessionEvent);
socket.on('end-event', () => {
    UTIL.showOverlay(false);
    PAGES.goto("event-idle");
});

// Chat message

socket.on("new_chatMessage", (msg, emit_time) => {
    UTIL.displayUnreadMessages([{emit_time: emit_time, message: msg}]);
})