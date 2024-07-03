

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

    if (current == "all") {
        socket.emit("sms", txt, "all")
    }

    if (current == "groupe") {
        g_string = "@"+document.getElementById('groupe_sms').value
        socket.emit("sms", txt, g_string)
    }
}

function fill_select(){
    query("Groupe.list").then((list) => {
        list.forEach((groupe)=> {
            let select = document.getElementById('groupe_sms')
            $('<option>').text(groupe.name).val(groupe.id).appendTo(select)
        })
    })
}
function clean_select() {
    let have_child = document.getElementById("groupe_sms").childNodes
    
    while (have_child.length > 1 ) {
        have_child[1].remove();
    }
}

document.getElementById("create_groupe").addEventListener("click", (e)=>{
    let g_name = document.getElementById("groupe_name").value
    let u_id = document.getElementById("user_id").value
    let g_desc = document.getElementById("g_desc").value
    socket.emit("groupe_create", g_name,u_id,g_desc)
})

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

let list = document.getElementById("select_menu_sms")
list.addEventListener('change', (e)=>{

    switch (list.value) {
        case 'manuel':
            document.getElementById("num_sms").style.display = 'block';
            document.getElementById("groupe_sms").style.display = 'none';
            break;
        case 'all':
            document.getElementById("num_sms").style.display = 'none';
            document.getElementById("groupe_sms").style.display = 'none';
            break;    
        case 'groupe':
            clean_select()
            fill_select()
            document.getElementById("num_sms").style.display = 'none';
            document.getElementById("groupe_sms").style.display = 'block';
            break;
    }

})

//button send
document.getElementById('test').addEventListener('click', (e) => {
    doSend()
})