
// PASSWORD
//
if (!Cookies.get('pass')) {
    pass = prompt("Password", "") 
    Cookies.set('pass', pass, { expires: 10 })
}
var password = Cookies.get('pass')

// LOG
//
function log(...msg) {
    console.log(...msg)
    document.getElementById('logs').innerHTML += msg.join(', ') + "<br>"
    document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight;
}

// SOCKETIO INIT
//
const socket = io();

// SOCKET SEND
//
function ctrl(name, args) 
{
    socket.emit('ctrl', {
        name: name,
        args: args
    });
}

function query(name, args) 
{
    var resid = Math.random().toString(36).substring(2);
    socket.emit('query', {
        name: name,
        args: args,
        resid: resid
    });
    return new Promise((resolve, reject) => {
        socket.once('ok-'+resid, (data) => { resolve(data) })
        socket.once('ko-'+resid, (data) => { try {reject(data)} catch(e) {log("ERROR: ", data)}})
    })
}

// LISTS
//
function updateSessions() { 
    query("Session.list")
        .then((sessions) => { 
            console.log(sessions)
            $('#sessions').empty()
            var table = $('<table>').appendTo('#sessions')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)
            
            $('<th>').text('id').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('starting_at').appendTo(tr)
            $('<th>').text('ending_at').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            sessions.forEach((session) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(session.id).appendTo(tr)
                $('<td>').text(session.name).appendTo(tr)
                $('<td>').text(session.starting_at).appendTo(tr)
                $('<td>').text(session.ending_at).appendTo(tr)
                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete session " + session.name + " ?") &&
                        query("Session.delete", session.id).then(updateSessions)
                })
            })
        })
}

function updateUsers() {
    query("User.list")
        .then((users) => { 
            $('#users').empty()
            var table = $('<table>').appendTo('#users')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)
            
            $('<th>').text('uuid').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('phone').appendTo(tr)
            $('<th>').text('selected_avatar').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            users.forEach((user) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(user.uuid).appendTo(tr)
                $('<td>').text(user.name).appendTo(tr)
                $('<td>').text(user.phone).appendTo(tr)
                $('<td>').text(user.selected_avatar).appendTo(tr)
                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete user " + user.name + " ?") &&
                        query("User.delete", user.id).then(updateUsers)
                })
            })
        })
}

// SOCKET RECEIVE
//
socket.on('hello', () => { 
    document.getElementById('logs').innerHTML = ""
    log("hello") 
    
    socket.emit('login', password);
    updateSessions()
    updateUsers()
})

socket.on('log', (msg) => { log(msg) })

socket.on('auth', (msg) => {
    if (msg == "ok") log("auth ok")
    else {
        Cookies.remove('pass')
        alert("You are not logged in !")
        location.reload()
    }
})


// CONTROLS
//

document.getElementById('color-event').addEventListener('click', () => {
    ctrl("color", ["red", "blue", "green"])
});

document.getElementById('text-event').addEventListener('click', () => {
    ctrl("text", ["Hello world !", "Goodbye world !"])
});

document.getElementById('end-event').addEventListener('click', () => {
    ctrl("end")
});

document.getElementById('flash-on').addEventListener('click', () => {
    ctrl("flash", true)
});

document.getElementById('flash-off').addEventListener('click', () => {
    ctrl("flash", false)
});

document.getElementById('vibrate').addEventListener('click', () => {
    ctrl("vibrate", [500, 100, 200, 50, 100])
});


// SESSIONS
//

document.getElementById('session-new').addEventListener('click', () => {
    var name = prompt("Session name", "").trim()
    
    query("Session.new", name).then(updateSessions)
})



