// const test = document.querySelector('#models-test');
// new models.Session(1, 'Test Session', '2020-01-01', 10, 5, test);
// new models.Evenement('Test Event', '2020-01-01', '12:00', 'Test Location', test);

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
    document.getElementById('main-logs').innerHTML += msg.join(', ') + "<br>"
    document.getElementById('main-logs').scrollTop = document.getElementById('main-logs').scrollHeight;
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

socket.on('log', (msg) => { log(msg) })

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll(".modal-bg").forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
    closeModal(modal.id);
});

const ses_container = document.getElementById("sessions-container")
function updateSessions() { 
    ses_container.innerHTML = ""
    query("Session.list")
    .then((sessions) => { 
        console.log(sessions)
        sessions.forEach(ses => {
            query("Session.getfull", ses.id).then((data) => {
                // console.log(data)
                const session_button = new models.Session(data.id, data.name, `${data.starting_at.split('T')[0]} - ${data.ending_at.split('T')[0]} `, 0, 0, ses_container)
                new models.SessionPage(data, session_button.dom)
            });
        });
    })
}

/* New session handler */
/* */

const newSessionName = document.getElementById('new-session-title')
const newSessionStart = document.getElementById('new-session-start')
const newSessionEnd = document.getElementById('new-session-end')
const newSessionBtn = document.getElementById('new-session-submit')

newSessionBtn.addEventListener('click', () => {
    query("Session.new", {
        name: newSessionName.value,
        starting_at: newSessionStart.value,
        ending_at: newSessionEnd.value
    })
    .then(() => {
        updateSessions()
        closeModal('modal-new-session')
    })
})

/* Users */
/* */

function updateUsers() {
    query("User.list")
        .then((users) => { 
            $('#users').empty()
            var table = $('<table>').appendTo('#users')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)
            
            $('<th>').text('id').appendTo(tr)
            $('<th>').text('uuid').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('phone').appendTo(tr)
            $('<th>').text('selected_avatar').appendTo(tr)
            $('<th>').text('sessions').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            users.forEach((user) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(user.id).appendTo(tr)
                $('<td>').text(user.uuid).appendTo(tr)
                $('<td>').text(user.name).appendTo(tr)
                $('<td>').text(user.phone).appendTo(tr)
                $('<td>').text(user.selected_avatar).appendTo(tr)

                var sessions = $('<td>').appendTo(tr)
                query("User.getfull", {uuid: user.uuid}).then((data) => {
                    data.sessions.forEach((session) => {
                        $('<span>').text(session.name + ' ').appendTo(sessions).on('click', () => {
                            if (confirm("Unregister user " + user.name + " from session " + session.name + " ?")) 
                                query("User.unregister", [user.uuid, session.id]).then(updateUsers)
                        })
                    })
                })

                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete user " + user.name + " ?") &&
                        query("User.delete", user.uuid).then(updateUsers)
                })
            })
        })
}

/* Init handler */
/* */

socket.on('hello', () => { 
    document.getElementById('main-logs').innerHTML = ""
    socket.emit('login', password);
    updateSessions()
    updateUsers()
})
