var NETWORK = {};

var userData = null;
var nextSession = null;

var socket = io();

// MODELS QUERY
//
NETWORK.query = function (name, args) 
{
    var resid = Math.random().toString(36).substring(2);
    socket.emit('query', {
        name: name,
        args: args,
        resid: resid
    });
    var p = new Promise((resolve, reject) => {
        socket.once('ok-'+resid, (data) => { resolve(data) })
        socket.once('ko-'+resid, (data) => { reject(data)} )
    })
    return p
}

NETWORK.requestAvatar = async function() {
    return new Promise((resolve, reject) => {
        NETWORK.query("Avatar.new", {user_id: userData.id, url: "https://picsum.photos/256/256"}).then((data) => {
           resolve(data);
        });
    });
}

NETWORK.loadUser = function() {

    // Load USER from UUID token
    const token = Cookies.get('token');
    console.log("User token :", token)
    // console.log("User token :", token)

    NETWORK.query('User.getfull', {uuid: token})
                .then((data) => {
                    userData = data;

                    log('User loaded', data);
                    // log('auth successful.');

                    // Routing based on user status
                    //
                    if (!userData.name) {                       // name is missing
                        PAGES.goto("pseudonyme_register");
                    } else if (userData.genjobs.length > 0) {
                        PAGES.goto("create_avatar_processing");
                    }
                    // COMMENTAIRES A ENLEVER CAR DEBUG
                    /*else if (userData.avatars.length == 0) {    // avatars are missing
                        PAGES.goto("create_avatar_photo"); 
                    }
                                                                // no avatar selected
                    else if (!userData.selected_avatar) {
                        PAGES.selectAvatar(userData.avatars);
                    }*/
                    else {
                        PAGES.goto("main");          // profile page
                        UTIL.shownav(true);

                        // Load next session and offers to register
                        NETWORK.query('Session.next')
                                .then((id) => {
                                    // check if user is already registered from userData
                                    nextSession = id;

                                    // console.log("NEXT SESSION INFO", nextSession, userData);

                                    if (!userData.sessions.map((s) => s.fields.id).includes(nextSession)) {
                                        console.log("User not registered to next session");

                                        // check if user declined to register
                                        if (Cookies.get('session_declined_'+nextSession)) {
                                            console.log("User declined to register");
                                            pages.goto("main");
                                            return;
                                        }

                                        // Get session details
                                        NETWORK.query('Session.get', nextSession)
                                            .then((session) => {
                                                UTIL.promptForSubscribingEvent(session, nextSession);
                                            });
                                    } else {
                                        let events = userData.sessions[0].events;
                                        if (events.length > 0) {
                                            if (isEventActive()) return;
                                            PAGES.goto("event-list");
                                            events.sort((a, b) => new Date(a.starting_at) - new Date(b.starting_at));
                                            events.forEach(evenement => {
                                                UTIL.addIncomingEvent(evenement.fields);
                                            })
                                        }
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

socket.on('hello', () => 
{
    console.log("Connexion established with server");

    NETWORK.loadUser();
});

NETWORK.receiveSessionEvent = function(event) {
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
        case "flash" :
            PAGES.goto("event-flash");
            break;
    }
}

socket.on('start-event', NETWORK.receiveSessionEvent);
socket.on('end-event', () => {
    PAGES.goto("main");
    UTIL.showOverlay(false);
});