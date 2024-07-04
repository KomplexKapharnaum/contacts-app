const socket = io();

socket.on("newQM", (data) => {
    right("last")
})

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

function get_message(session_id) {
    socket.emit("msg_request", session_id)
};

function right() {

    let session_id = document.getElementById("listSess2").value

    get_message(session_id)

    socket.on("listed_msg", (msg_list) => {

        let count = 0
        msg_list.forEach((m) => {
            console.log("truc2")

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

            console.log(field)

            count++
        })
    });
    // }

}

document.getElementById("send_msg").addEventListener("click", (e) => {
    let message = document.getElementById("message").value
    let session = document.getElementById("listSess").value
    socket.emit("chat_msg", message, session)
})

fill_select_session("listSess")

function fill_select_session(id_html) {

    let select = document.getElementById(id_html)
    query("Session.list").then((list) => {
        list.forEach((session) => {
            $('<option>').text(session.name).val(session.id).appendTo(select)
        })
    })
}

///////////////////////////////////////////////////////////////
////////  
////////  test purpose
////////  
///////////////////////////////////////////////////////////////

document.getElementById("read").addEventListener("click", (e) => {
    // delete quand finit
    right()
    socket.emit('truc', "")
    //
})


fill_select_session("listSess2")
// setTimeout(right(), 3000)

