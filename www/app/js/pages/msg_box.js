const socket = io();

socket.on("newQM", (data) => {
    console.log("New QM received:", data)
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

function get_message() {
    var msg_array = new Array()
    query('Message.list', ['', 20]).then((msg)=>{
        msg.forEach((msg)=>{
            if (msg.message != null){
                msg_array.push([msg.message, msg.emit_time])

            }
        })
    })
    return msg_array
}

function right() {
    if (true) {
        // creation des message_box si aucune presente
        msg = get_message()
        console.log(msg)
        // console.log(msg)
    } else {
        // ecriture des nouveau message
        query('Message.list', ['', 10])
    }

}

document.getElementById("read").addEventListener("click", (e) => {
    // delete quand finit
    right()
    socket.emit('truc', "")
    //
})

document.getElementById("send_msg").addEventListener("click", (e) => {
    socket.emit("chat_msg", message)

})


// let count = 0
// let field = document.createElement("fieldset")
//                 let hidden_input = document.createElement('input')
//                 hidden_input.type = "hidden"
//                 let p = document.createElement("p")

//                 document.getElementById('inbox').appendChild(field)
//                 field.setAttribute("id", "msg"+count)

//                 hidden_input.value = msg.emit_time
//                 p.innerHTML = msg.message

//                 document.getElementById('msg'+count).appendChild(p)
//                 document.getElementById('msg'+count).appendChild(hidden_input)
//                 count++