const socket = io();

function doSend() {

    let current = document.getElementById('select_menu_sms').value;

    let txt = document.getElementById('msg_sms').value

    if (current == "manuel") {

        let num = document.getElementById('num_sms').value

        // destruction des espaces potentiel
        num = num.replace(/ /g, '');

        // regex verification 10 digit avant envoie
        if (/\d{10}/.test(num)) {
            socket.emit("sms", txt, num)
        }
    }

    var pass_string = ''
    if (current == "all") {
        pass_string = "|" + document.getElementById('session_choice').value
        socket.emit("sms", txt, pass_string)
    }

    if (current == "groupe") {
        pass_string = "@" + document.getElementById('groupe_sms').value
        socket.emit("sms", txt, pass_string)
    }

}

function fill_select_groupe() {

    let select = document.getElementById('groupe_sms')
    $('<option>').text("-----------").val("").appendTo(select)

    let session_id = document.getElementById("session_choice").value

    query("Group.list", { "session_id": session_id }).then((groupe) => {
        groupe.forEach((g) => {
            $('<option>').text(g.name).val(g.id).appendTo(select)
        })
    })
}

function fill_select_session(id_html) {

    let select = document.getElementById(id_html)
    $('<option>').text("-----------").val("").appendTo(select)

    query("Session.list").then((list) => {
        list.forEach((session) => {
            $('<option>').text(session.name).val(session.id).appendTo(select)
        })
    })
}

function clean_select(groupe, session) {
    if (groupe) {
        let have_child = document.getElementById("groupe_sms").childNodes
        while (have_child.length > 1) {
            have_child[1].remove();
        }
    }
    if (session) {
        have_child = document.getElementById("session_choice").childNodes
        while (have_child.length > 1) {
            have_child[1].remove();
        }
    }
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

let list = document.getElementById("select_menu_sms")
list.addEventListener('change', (e) => {

    switch (list.value) {
        case 'manuel':

            document.getElementById("session_pop").style.display = 'none'
            document.getElementById("num_sms").style.display = 'block';
            document.getElementById("groupe_pop").style.display = 'none';
            break;

        case 'all':

            clean_select('', 'session')
            fill_select_session("session_choice")

            document.getElementById("session_pop").style.display = 'block';
            document.getElementById("num_sms").style.display = 'none';
            document.getElementById("groupe_pop").style.display = 'none';
            break;

        case 'groupe':

            clean_select('groupe', 'session')
            fill_select_session("session_choice")
            fill_select_groupe()

            document.getElementById("session_pop").style.display = 'block'
            document.getElementById("num_sms").style.display = 'none';
            document.getElementById("groupe_pop").style.display = 'block';
            break;

    }
})

document.getElementById("create_groupe").addEventListener("click", (e) => {
    let s_id = document.getElementById("create_group_sess").value
    let g_name = document.getElementById("groupe_name").value
    let u_id = document.getElementById("user_id").value
    let g_desc = document.getElementById("g_desc").value
    socket.emit("groupe_create", s_id, g_name, u_id, g_desc)
})

let list_sess = document.getElementById("session_choice")
list_sess.addEventListener("change", (e) => {
    clean_select("groupe", '')
    fill_select_groupe();

})

fill_select_session("create_group_sess")

//button send
document.getElementById('test').addEventListener('click', (e) => {
    doSend()
})