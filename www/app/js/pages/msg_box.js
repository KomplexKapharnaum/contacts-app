const socket = io();

// connexion des users et envoie demande de modi base
socket.on('hello', () => {
    socket.emit("identify", Cookies.get('token'))
});

socket.on("new_chatMessage", (data) => {
    right(true)
})

socket.on("listed_msg", (msg_list) => {

    let count = 0
    msg_list.forEach((m) => {

        let field = document.createElement("fieldset")
        let hidden_input = document.createElement('input')
        let p = document.createElement("p")

        field.setAttribute("id", "msg" + count)

        hidden_input.type = "hidden"
        p.innerHTML = m[0]
        hidden_input.value = m[1]

        document.getElementById('inbox').appendChild(field)
        document.getElementById('msg' + count).appendChild(p)
        document.getElementById('msg' + count).appendChild(hidden_input)

        count++
    })
});

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

function right(last) {

    if (last == true) {
        let session_id = document.getElementById("listSess").value
        query("Message.last", {"session_id": session_id }).then(
            (message) => {
                message.forEach((msg) => {

                    let inbox = document.getElementById("inbox")
                    let fieldset = $('<fieldset>').appendTo(inbox)
                    $('<p>').text(msg.message).appendTo(fieldset)

                    socket.emit("last_read", Cookies.get('token'))
                })
            })
    } else {
        setTimeout(() => {
            let session_id = document.getElementById("listSess2").value
            query("Message.list", { 'session_id': session_id }).then(
                (message) => {
                    message.forEach((msg) => {

                        let inbox = document.getElementById("inbox")
                        let fieldset = $('<fieldset>').appendTo(inbox)
                        $('<p>').text(msg.message).appendTo(fieldset)

                    })
                })
        }, 1000);

    }

}

document.getElementById("send_msg").addEventListener("click", (e) => {
    let message = document.getElementById("message").value
    let session = document.getElementById("listSess").value
    let checked = document.getElementById("checkSMS").checked
    socket.emit("chat_msg", message, session, checked)
})

fill_select_session("listSess")
fill_select_group("listGroup")
let gSelect = document.getElementById("listSess").addEventListener("change", ()=>{
    fill_select_group("listGroup")
})

function fill_select_session(id_html) {

    let select = document.getElementById(id_html)
    query("Session.list").then((list) => {
        list.forEach((session) => {
            $('<option>').text(session.name).val(session.id).appendTo(select)
        })
    })
}

let select = document.getElementById("listGroup")
$('<option>').text("-----------").val("").appendTo(select)
function fill_select_group(id_html) {

    let have_child = document.getElementById(id_html).childNodes
        while (have_child.length > 1) {
            have_child[1].remove();
            console.log('removed G')
            console.log(have_child.length)
        }

    let session_id = document.getElementById("listSess").value

    query("Group.list", { "session_id": session_id }).then((groupe) => {
        groupe.forEach((g) => {
            $('<option>').text(g.name).val(g.id).appendTo(select)
        })
    })
}
right()


///////////////////////////////////////////////////////////////
////////  
////////  test purpose
////////  
///////////////////////////////////////////////////////////////

fill_select_session("listSess2")


