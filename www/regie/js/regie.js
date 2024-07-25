/* Configuration */
/* */

const config = {
    base_colors: ["#F00", "#0F0", "#00F", "#FF0", "#0FF", "#F0F", "#FFF"]
}

/* Utilitary */
/* */

function click(id, callback) {
    document.getElementById("btn-" + id).addEventListener("click", callback)
}

function getParams(page) {
    let params = {}
    const inputs = document.querySelector("[data-page-id='" + page + "']").querySelectorAll("input, textarea")
    inputs.forEach(i => {
        if (!i.dataset.param) return;
        if (i.type == "checkbox") {
            params[i.dataset.param] = i.checked
        } else {
            params[i.dataset.param] = i.value
        }
    })
    return params
}

/* Cookies & Password check */
/* */

Cookies = {
    get: function(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=")
        if (parts.length == 2) return parts.pop().split(";").shift()
    },
    set: function(name, value, days) {
        var d = new Date
        d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days)
        document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString()
    },
    str: function() {
        return document.cookie
    }
};


if (!Cookies.get('pass')) {
    pass = prompt("Password", "")
    Cookies.set('pass', pass, { expires: 10 })
}
var password = Cookies.get('pass')

/* Debug */
/* */

if (window.location.host == "contest.kxkm.net" || window.location.host.includes('localhost')) {
    // document.body.style.border = "2px solid yellow";
}

/* Socket handler */
/* */

var socket = io()

socket.on('hello', () => {
    log("Connexion established with server");
    socket.emit('login', password);
})

function ctrl(name, args = false) {

    if (args && !args.params.grpChoice) args.params.grpChoice = ''

    socket.emit('ctrl', {
        name: name,
        args: args?args:{}
    })
}

let current_event_state = false
socket.on("adminEventState", (eventState) => {
    current_event_state = eventState
    setEventBtnState(eventState)
})

/* Event console log */
/* */

const box_log = document.getElementById("box-event-logs")
function log(...msg) {
    console.log(...msg)
    box_log.innerHTML += msg.join(', ') + "<br>"
    box_log.scrollTop = box_log.scrollHeight
}

/* Color event */
/* */

const colors_container = document.getElementById("grid-colors")

function add_color(color) {
    const div = document.createElement("div")
    div.style.backgroundColor = color
    
    const icon = ICON.get("check")
    div.appendChild(icon)

    div.addEventListener("click", () => {
        div.classList.toggle("selected")
    })

    colors_container.appendChild(div)
}

config.base_colors.forEach(col => {
    add_color(col)
})

click("color-send", () => {
    const colors = [...colors_container.querySelectorAll(".selected")].map(e => e.style.backgroundColor);
    const args = {
        colors : colors,
        params : getParams("color")
    }
    ctrl("color", args)
})

/* Text event */
/* */

const text_input = document.getElementById("input-text-addtext")
const tem_textitem = document.getElementById("template-text-item")
const texts_container = document.getElementById("box-text-items")

click("text-add", () => {
    const txt = text_input.value
    const tem = tem_textitem.cloneNode(true).content.querySelector(".input_field")
    tem.querySelector("input").value = txt
    tem.querySelector("button").addEventListener("click", () => {
        tem.remove()
    })
    texts_container.appendChild(tem)
})

click("text-send", () => {
    const texts = [...texts_container.querySelectorAll(".input_field")].map(e => e.querySelector("input").value);
    const args = {
        texts : texts,
        params : getParams("text")
    }
    ctrl("text", args)
})

/* Image */
/* */

const image_input = document.getElementById("input-image-addimage")
const images_container = document.getElementById("grid-images")

click("image-add", () => {
    const txt = image_input.value
    const img = document.createElement("img")
    img.src = txt
    images_container.appendChild(img)
    img.addEventListener("click", () => {
        images_container.removeChild(img)
    })
})

click("image-send", () => {
    const images = [...images_container.querySelectorAll("img")].map(e => e.src)
    const args = {
        images : images,
        params : getParams("image")
    }
    ctrl("image", args)
})

/* Info */
/* */

click("info-send", () => {
    const val = document.getElementById("textarea-info").value
    const args = {
        message : val,
        params : {}
    }

    ctrl("info", args)
})

/* Additional inputs */

click("end-current-event", () => {
    ctrl("end")
})

click("reload-event", () => {
    if (confirm("Reload page for everyone ?"))
    ctrl("reload")
})

document.addEventListener("click", () => {
    const el = document.documentElement;
    const rfs = el.requestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (rfs) {
        rfs.call(el);
    }
    else if (window.parent !== window) {
        parent.postMessage('fullscreen', '*');
    }  
})

// setEventState

click("set-event-state", () => {
    current_event_state = !current_event_state
    setEventBtnState(current_event_state)
    socket.emit('setEventState', current_event_state)
});

function setEventBtnState(state) {
    const btn = document.getElementById("btn-set-event-state");
    btn.innerHTML = state ? "STOP EVENT" : "START EVENT";
}
