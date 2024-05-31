var NETWORK = {};

var userData = null;
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

NETWORK.loadUser = function() {

    // Load USER from UUID token
    const token = Cookies.get('token');
    // console.log("User token :", token)

    NETWORK.query('User.load', token)
                .then((data) => {
                    userData = data;

                    // log('auth successful.', data);
                    log('auth successful.');

                    // Routing based on user status
                    //
                    if (!userData.name) {                     // name is missing
                        PAGES.goto("pseudonyme_register");
                    }
                    else if (userData.avatars.length == 0) {   // avatars are missing
                        PAGES.goto("create_avatar_photo"); 
                    }
                    else {
                        PAGES.goto("event-countdown"); // profile page
                        UTIL.shownav(true);
                    }    
                    
                })
                .catch((err) => {
                    log('auth failed.', err);
                    Cookies.set('token', "", 30)
                    PAGES.goto("home");
                });
}

NETWORK.requestAvatar = async function(args) {
    // socket.emit('requestAvatar', args);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({status: "ok", url: "https://picsum.photos/256/256"});
        }, 3000);
    });
}

socket.on('hello', () => 
{
    console.log("Connexion established with server");
    NETWORK.loadUser();
});

NETWORK.receiveSessionEvent = function(event) {
    let container;
    switch (event.name) {
        case "color" :
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
        case "text" :
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
        case "flash" :
            PAGES.goto("event-flash");
            break;
    }
}