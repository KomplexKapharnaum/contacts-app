
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

// MODAL FORM
//
function modalForm(title, callback) {
    var modal = $('<div>').addClass('modal').appendTo('body')
    var modalDialog = $('<div>').addClass('modal-dialog').appendTo(modal)
    var modalContent = $('<div>').addClass('modal-content').appendTo(modalDialog)
    var modalHeader = $('<div>').addClass('modal-header').appendTo(modalContent)
    var modalTitle = $('<h5>').addClass('modal-title').text(title).appendTo(modalHeader)
    var modalBody = $('<div>').addClass('modal-body').appendTo(modalContent)
    var modalFooter = $('<div>').addClass('modal-footer').appendTo(modalContent)
    var modalSubmit = $('<button>').addClass('btn btn-primary').text('Submit').appendTo(modalFooter)
    var modalClose = $('<button>').addClass('btn btn-secondary').text('Close').appendTo(modalFooter)

    modalClose.on('click', () => { modal.remove() })
    modalSubmit.on('click', () => { callback(modal, modal) })
    return modal
}

// SOCKETIO INIT
//
const socket = io();

// SOCKET SEND
//
function ctrl(name, args = false) {

    if (args && !args.params.grpChoice) args.params.grpChoice = '';

    socket.emit('ctrl', {
        name: name,
        args: args?args:{}
    });
}

function query(name, args) {
    var resid = Math.random().toString(36).substring(2);
    socket.emit('query', {
        name: name,
        args: args,
        resid: resid
    });
    return new Promise((resolve, reject) => {
        socket.once('ok-' + resid, (data) => { resolve(data) })
        socket.once('ko-' + resid, (data) => { try { reject(data) } catch (e) { log("ERROR: ", data) } })
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

                $('<td>').text(session.name).appendTo(tr).on('click', () => {
                    var name = prompt("Session name", session.name).trim()
                    if (name) query("Session.update", [session.id, { name: name }]).then(updateSessions)
                })

                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(session.starting_at).on('change', (e) => {
                        query("Session.update", [session.id, { starting_at: e.target.value }]).then(updateSessions)
                    })
                )

                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(session.ending_at).on('change', (e) => {
                        query("Session.update", [session.id, { ending_at: e.target.value }]).then(updateSessions)
                    }
                    ))

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

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('uuid').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('phone').appendTo(tr)
            $('<th>').text('selected_avatar').appendTo(tr)
            $('<th>').text('sessions').appendTo(tr)
            $('<th>').text('last_read').appendTo(tr)
            $('<th>').text('is_connected').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            users.forEach((user) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(user.id).appendTo(tr)
                $('<td>').text(user.uuid).appendTo(tr)
                $('<td>').text(user.name).appendTo(tr)
                $('<td>').text(user.phone).appendTo(tr)
                $('<td>').text(user.selected_avatar).appendTo(tr)

                var sessions = $('<td>').appendTo(tr)
                query("User.getfull", { uuid: user.uuid }).then((data) => {
                    data.sessions.forEach((session) => {
                        $('<span>').text(session.name + ' ').appendTo(sessions).on('click', () => {
                            if (confirm("Unregister user " + user.name + " from session " + session.name + " ?"))
                                query("User.unregister", [user.uuid, session.id]).then(updateUsers)
                        })
                    })
                })

                $('<td>').text(user.last_read).appendTo(tr)
                $('<td>').text(user.is_connected).appendTo(tr)

                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete user " + user.name + " ?") &&
                        query("User.delete", user.uuid).then(() => {
                            updateAvatars()
                            updateUsers()
                        })
                })
            })
        })
}

function updateAvatars() {
    query("Avatar.list")
        .then((avatars) => {
            $('#avatars').empty()
            var table = $('<table>').appendTo('#avatars')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('user_id').appendTo(tr)
            $('<th>').text('url').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            avatars.forEach((avatar) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(avatar.id).appendTo(tr)
                $('<td>').text(avatar.user_id).appendTo(tr)
                $('<td>').text(avatar.url).appendTo(tr)
                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete avatar " + avatar.url + " ?") &&
                        query("Avatar.delete", avatar.id).then(updateAvatars)
                })
            })
        }
        )
}

function updateMessages() {
    query("Message.list")
        .then((messages) => {
            $('#messages').empty()
            var table = $('<table>').appendTo('#messages')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('data').appendTo(tr)
            $('<th>').text('emit_time').appendTo(tr)
            $('<th>').text('message').appendTo(tr)
            $('<th>').text('session_id').appendTo(tr)
            $('<th>').text('group_id').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            messages.forEach((message) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(message.id).appendTo(tr)
                $('<td>').text(message.data).appendTo(tr)
                $('<td>').text(message.emit_time).appendTo(tr)
                $('<td>').text(message.message).appendTo(tr)
                $('<td>').text(message.session_id).appendTo(tr)
                $('<td>').text(message.group_id).appendTo(tr)
                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete message " + message.message + " ?") &&
                        query("Message.delete", message.id).then(updateMessages)
                })
            })
        })
}


function updateEvents() {
    query("Event.list")
        .then((events) => {
            $('#events').empty()
            var table = $('<table>').appendTo('#events')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('starting_at').appendTo(tr)
            $('<th>').text('ending_at').appendTo(tr)
            $('<th>').text('location').appendTo(tr)
            $('<th>').text('description').appendTo(tr)
            $('<th>').text('session_id').appendTo(tr)
            $('<th>').text('actions').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            events.forEach((event) => {
                var tr = $('<tr>').appendTo(tbody)

                const start = new Date(event.starting_at);
                const end = new Date(event.ending_at);
                const now = new Date();
                const isEventLive = start < now && now < end;
                if (isEventLive) tr.css('background-color', 'darkgreen');

                $('<td>').text(event.id).appendTo(tr)
                $('<td>').text(event.name).appendTo(tr)
                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(event.starting_at).on('change', (e) => {
                        query("Event.update", [event.id, { starting_at: e.target.value }]).then(updateEvents)
                    })
                )
                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(event.ending_at).on('change', (e) => {
                        query("Event.update", [event.id, { ending_at: e.target.value }]).then(updateEvents)
                    })
                )

                $('<td>').text(event.location).appendTo(tr).on('click', () => {
                    var location = prompt("Location", event.location).trim()
                    if (location) query("Event.update", [event.id, { location: location }]).then(updateEvents)
                })

                $('<td>').text(event.description).appendTo(tr).on('click', () => {
                    var description = prompt("Description", event.description).trim()
                    if (description) query("Event.update", [event.id, { description: description }]).then(updateEvents)
                })
            
                $('<td>').text(event.session_id).appendTo(tr)

                var actions = $('<td>').appendTo(tr)
                $('<button>').text('flash').appendTo(actions).on('click', () => {
                    ctrl("flash", true)
                })

                $('<select>', { id: 'grp' }).appendTo(actions)

                
                //////////////// tempo
                $('<option>', { text: " ------ ",value: "" }).appendTo("#grp")
                query("Group.list").then((group) => {
                    group.forEach((g) => {
                        $('<option>', { text: g.name,value: g.id }).appendTo("#grp")
                    })
                })
                //////////////
                
                $('<button>').text('color').appendTo(actions).on('click', () => {
                    const promptColor = prompt("Color", "Séparez chaque couleur par un ';'").split(";").map(c => c.trim());
                    const flashing = confirm("Flashing ?");
                    const autoselect = confirm("Random autoselect ?");

                    const grpChoice = document.getElementById("grp").value
                    ctrl("color", { colors: promptColor, params: { flash: flashing, random: autoselect , grpChoice: grpChoice}})

                });

                $('<button>').text('text').appendTo(actions).on('click', () => {
                    const promptText = prompt("Textes", "Séparez chaque textes par un ';'").split(";").map(c => c.trim());
                    const autoselect = confirm("Random autoselect ?");

                    const grpChoice = document.getElementById("grp").value
                    ctrl("text", { texts: promptText, params: { random: autoselect, grpChoice: grpChoice } })
                });

                $('<button>').text('image').appendTo(actions).on('click', () => {
                    const promptText = prompt("Image", "Séparez chaques URL par un ';'").split(";").map(c => c.trim());
                    const autoselect = confirm("Random autoselect ?");

                    const grpChoice = document.getElementById("grp").value
                    ctrl("image", { images: promptText, params: { random: autoselect, grpChoice: grpChoice } })
                });

                $('<button>').text('info').appendTo(actions).on('click', () => {
                    const promptText = prompt("Image", "Ecrivez votre message ici...");

                    const grpChoice = document.getElementById("grp").value
                    ctrl("info", {message: promptText, params: {grpChoice: grpChoice}})
                });

                $('<button>').text('end').appendTo(actions).on('click', () => {
                    ctrl("end")
                });

                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete event " + event.name + " ?") &&
                        query("Event.delete", event.id).then(updateEvents)
                })
            })
        })
}


function updateGenjobs() {
    query("Genjob.list")
        .then((genjobs) => {
            $('#genjobs').empty()
            var table = $('<table>').appendTo('#genjobs')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('userid').appendTo(tr)
            $('<th>').text('status').appendTo(tr)
            $('<th>').text('workflow').appendTo(tr)
            $('<th>').text('userdata').appendTo(tr)
            $('<th>').text('input').appendTo(tr)
            $('<th>').text('output').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            genjobs.forEach((genjob) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(genjob.id).appendTo(tr)
                $('<td>').text(genjob.userid).appendTo(tr)
                $('<td>').text(genjob.status).appendTo(tr).on('click', () => {
                    query("Genjob.retry", genjob.id).then(updateGenjobs)
                })

                $('<td>').text(genjob.workflow).appendTo(tr)
                $('<td>').text(genjob.userdata).appendTo(tr)
                $('<td>').text(genjob.input).appendTo(tr)
                $('<td>').text(genjob.output).appendTo(tr)

                $('<td>').text('delete').appendTo(tr).on('click', () => {
                    confirm("Delete genjob " + genjob.id + " ?") &&
                        query("Genjob.delete", genjob.id).then(updateGenjobs)
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
    updateEvents()
    updateUsers()
    updateMessages()
    // updateAvatars()
    // updateGenjobs()
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

    query("Session.new", { name: name }).then(updateSessions)
})

// EVENTS
//

document.getElementById('event-new').addEventListener('click', () => {
    var name = prompt("Event name", "").trim()
    var session_id = prompt("Session id", "").trim()

    query("Event.new", { name: name, session_id: session_id }).then(updateEvents)
})


// LOAD AVATARS
document.getElementById('avatar-load').addEventListener('click', updateAvatars)

// LOAD GENJOBS
document.getElementById('genjob-load').addEventListener('click', updateGenjobs)