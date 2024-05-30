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
                        PAGES.goto("avatar-photo"); 
                    }
                    else PAGES.goto("main");    // profile page
                    
                })
                .catch((err) => {
                    log('auth failed.', err);
                    Cookies.set('token', "", 30)
                    PAGES.goto("home");
                });
}

socket.on('hello', () => 
{
    console.log("Connexion established with server");
    NETWORK.loadUser();
});
