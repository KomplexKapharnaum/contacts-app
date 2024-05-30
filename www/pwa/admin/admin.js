
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
function ctrl_do(name, args) 
{
    socket.emit('ctrl-do', {
        name: name,
        args: args
    });
}

function db_do(name, args) 
{
    var uuid = Math.random().toString(36).substring(7)
    socket.emit('db-do', {
        name: name,
        args: args,
        uuid: uuid
    });
    return new Promise((resolve, reject) => {
        socket.once('ok-'+uuid, (data) => { resolve(data) })
        socket.once('ko-'+uuid, (data) => { reject(data) })
    })
}

function db_get(name, args) 
{
    socket.emit('db-get', {
        name: name,
        args: args
    });
}

// SOCKET RECEIVE
//
socket.on('hello', () => { 
    document.getElementById('logs').innerHTML = ""
    log("hello") 
    
    socket.emit('login', password);
    db_get("Session.list")
    db_get("User.list") 
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

socket.on('trigger', (e) => { 
    socket.emit(e)
})

socket.on('Session.list', (sessions) => {
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
                db_do("Session.delete", session.id)
        })
    })
})


// CONTROLS
//

document.getElementById('color-event').addEventListener('click', () => {
    ctrl_do("color", ["red", "blue", "green"])
});

document.getElementById('text-event').addEventListener('click', () => {
    ctrl_do("text", ["Hello world !", "Goodbye world !"])
});

document.getElementById('end-event').addEventListener('click', () => {
    ctrl_do("end")
});

document.getElementById('flash-on').addEventListener('click', () => {
    ctrl_do("flash", true)
});

document.getElementById('flash-off').addEventListener('click', () => {
    ctrl_do("flash", false)
});

document.getElementById('vibrate').addEventListener('click', () => {
    ctrl_do("vibrate", [500, 100, 200, 50, 100])
});


// SESSIONS
//

document.getElementById('session-new').addEventListener('click', () => {
    var name = prompt("Session name", "").trim()
    
    db_do("Session.new", name)
        .then(() => { db_get("Session.list") })
        .catch((err) => { log("ERROR:", err) })
})



