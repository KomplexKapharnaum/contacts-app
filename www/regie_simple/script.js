const box_log = document.getElementById("box-event-logs")
function log(...msg) {
    console.log(...msg)
    box_log.innerHTML += msg.join(', ') + "<br>"
    box_log.scrollTop = box_log.scrollHeight
}

const COOKIES = {
    get: function(name) {
        const nameEQ = name + "="
        const ca = document.cookie.split(';')
        for(let i=0;i < ca.length;i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null
    },
    set: function(name,value,days=3650) {
        const date = new Date()
        date.setTime(date.getTime()+(days*24*60*60*1000))
        expires = "; expires="+date.toGMTString()
        document.cookie = name+"="+value+expires+"; path=/"
        console.log("CONFIG: set", name, value)
    },
    remove: function(name) {
        document.cookie = name+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        console.log("CONFIG: removed", name)
    }
}

if (!COOKIES.get('pass')) {
    pass = prompt("Password", "")
    COOKIES.set('pass', pass, { expires: 10 })
}
var password = COOKIES.get('pass')

/* Socket handler */
/* */

// Connect Socketio (if not already exists)
const socket = io()
socket.connected = false;

socket.on('connect', function () {
    console.log('SOCKETIO: Connected to server');
    socket.connected = 1;
});
socket.on('disconnect', function () {
    console.log('SOCKETIO: Disconnected from server');
    socket.connected = 0;
});

socket.on('hello', () => {
    log("Connexion established with server");
    socket.emit('admin-auth', password);
})

socket.on('admin-auth-failed', () => {
    log("Admin authentication failed");
    COOKIES.remove('pass')
    setTimeout(() => {
        location.reload();
    }, 1000);
})

function ctrl(name, args = {params:{}}) {

    if (!confirm("Envoyer la commande " + name + "?")) return;

    var resid = Math.random().toString(36).substring(2);

    if (!args.params) args.params = {}
    if (!args.params.tribe) {
        const tribe = document.getElementById("select-group").value
        args.params.tribe = tribe
    }

    socket.emit('ctrl', {
        name: name,
        args: args?args:{},
        resid: resid
    })

    socket.once('event-ok-' + resid, (data) => { 
        log(data)
    })
}

const categories = document.getElementById("categories");
const groups = document.getElementById("groups");

function showCategories(state) {
    if (state) {
        categories.classList.add("hidden");
        groups.classList.remove("hidden");
    } else {
        categories.classList.remove("hidden");
        groups.classList.add("hidden");
    }
}
showCategories(false);

function showGroup(name) {
    if (name) {
        const groupList = document.getElementsByClassName("actions");
        Array.from(groupList).forEach((group) => {
            if (group.dataset.category == name) {
                group.classList.remove("hidden");
            } else {
                group.classList.add("hidden");
            }
        })
        showCategories(true);
    } else {
        showCategories(false);
    }
}

function createDomCategoryButton(name, onclick) {
    const elm = document.createElement("button");
    elm.innerHTML = name;
    elm.classList.add("btn-category");
    elm.dataset.category = name
    elm.addEventListener("click", onclick);
    return elm
}

function createActions(name, actions) {
    const elm = document.createElement("div");
    elm.classList.add("actions");
    elm.dataset.category = name

    actions.forEach((action) => {
        const btn = document.createElement("button");
        btn.innerHTML = action.name;
        btn.addEventListener("click", () => {            
            ctrl(action.ctrl.name, action.ctrl.args);
        });
        elm.appendChild(btn);
    })

    return elm
}

function addCategory(name, actions) {
    const actionsElm = createActions(name, actions);
    groups.appendChild(actionsElm);

    const elm = createDomCategoryButton(name, () => {
        showGroup(name);
    });
    categories.appendChild(elm);
}

fetch('./config.json')
.then(response => response.json())
.then(data => {
    data.forEach((category) => {
        addCategory(category.name, category.actions);
    })
})

document.getElementById("back").addEventListener('click', () => {
    showCategories(false);
})

/* Color picker*/

var colorPicker = new iro.ColorPicker("#picker", {
    // Set the size of the color picker
    width: 300,
    // Set the initial color to pure red
    color: "#f00"
});

document.getElementById("send-custom-color").addEventListener("click", () => {
    const color = colorPicker.color.hexString;
    ctrl("color", {
        colors : [color]
    })
})

/* Tribe */

async function query(name, params={}) {
    params.pass = COOKIES.get('pass');
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/query?queryname=${name}&${queryString}`)
    const res = await response.json()
    return {
        status: response.status===200,
        data: res
    }
}

const select_usergroup = document.getElementById("select-group")

function fill_select_usergroup() {
    select_usergroup.innerHTML = ""

    const opt = document.createElement("option")
    opt.value = ""
    opt.innerHTML = "Everyone"
    select_usergroup.appendChild(opt)

    query("r_tribelist").then((res) => {
        if (!res.status) return;
        res.data.forEach((g) => {
            const opt = document.createElement("option")
            opt.value = g.id
            opt.innerHTML = g.name
            select_usergroup.appendChild(opt)
        })
    })
}

fill_select_usergroup()

/* Events */

const eventInfo = document.getElementById("event-info");

let firstEventID;
const endEvent = () => {
    if (!confirm("Terminer l'évènement ?")) return
    query("r_endevent", {event_id: firstEventID}).then(() => {
        alert("Évènement terminé.")
        ctrl("reload")
        update_events()  
    })
}

function update_events() {
    query("r_eventlist")
    .then((events) => {
        if (!events.status) return;

        events = events.data
        .filter(event => event.ended==false)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        eventInfo.removeEventListener("click", endEvent)

        if (events.length == 0) {
            eventInfo.classList.remove("active")
            eventInfo.innerHTML = "Pas d'évènements en cours.";
            return;
        }

        const first = events[0];
        firstEventID = first.id

        if (new Date(first.start_date) < new Date()) {
            eventInfo.classList.add("active")
            eventInfo.innerHTML = `Evenement en cours : <b>${first.name}</b>`
            eventInfo.addEventListener("click", endEvent)
        } else {
            eventInfo.classList.remove("active")
            eventInfo.innerHTML = "Prochain évènement : " + new Date(first.start_date).toLocaleString();
            setTimeout(update_events, 10000);
        }
    })
}

update_events()