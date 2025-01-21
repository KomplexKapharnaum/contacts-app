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

function log_time() {
    return `${new Date().getHours()}:${new Date().getMinutes()} →`
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

/* Socket handler */
/* */

var socket = io()

socket.on('hello', () => {
    log("Connexion established with server");
    socket.emit('admin-auth', password);
})

function ctrl(name, args = {params:{}}) {

    if (!current_event_state) {
        log(log_time() + " Event not live, aborting.")
        return;
    }

    var resid = Math.random().toString(36).substring(2);

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

let current_event_state = false
socket.on("adminEventState", (eventState) => {
    current_event_state = eventState
    setEventBtnState(eventState)
})

/*
query = function (name, ...args) {
    var resid = Math.random().toString(36).substring(2);
    socket.emit('query', {
        name: name,
        args: args,
        resid: resid
    });
    var p = new Promise((resolve, reject) => {
        socket.once('ok-' + resid, (data) => { resolve(data) })
        socket.once('ko-' + resid, (data) => { reject(data) })
    })
    return p
}
*/

async function query(name, params={}) {
    params.pass = Cookies.get('pass');
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/query?queryname=${name}&${queryString}`)
    const res = await response.json()
    return {
        status: response.status===200,
        data: res
    }
}

/* Event console log */
/* */

const box_events = document.getElementById("box-events")

function load_events() {
    box_events.innerHTML = ""

    const btn_reload = document.createElement("button")
    btn_reload.innerHTML = "Rafraichir"
    btn_reload.classList.add("sm")

    box_events.appendChild(btn_reload)

    btn_reload.addEventListener("click", () => {
        load_events()
    })

    query("r_eventlist")
    .then((events) => {
        events = events.data
        events = events.filter(event => event.ended==false);
        events.forEach(event => {
            const btn = document.createElement("button")
            btn.classList.add("sm","event-btn")
            const name = document.createElement("span")
            name.innerHTML = event.name

            const starting_at = document.createElement("span")
            starting_at.innerHTML = new Date(event.start_date).toLocaleString()

            let now = false;

            if (new Date(event.start_date) < new Date()) {
                starting_at.innerHTML = "Maintenant"
                now = true;
            }

            btn.appendChild(name)
            btn.appendChild(starting_at)

            btn.addEventListener("dblclick", () => {

                if (!event.location) return

                let zoom, lat, lon;
                let loc = event.location.split(",")
                if (loc.length>=2) {
                    lat = loc[0]
                    lon = loc[1]
                    zoom = (loc.length==3) ? loc[2] : 18
                } 
                else {
                    loc = event.location.split("/")
                    if (loc.length>=2) {
                        zoom = (loc.length==3) ? loc[0] : 18
                        lat = (loc.length==3) ? loc[1] : loc[0]
                        lon = (loc.length==3) ? loc[2] : loc[1]
                    }
                } 
                const url = "https://maps.google.com/?q="+lat+","+lon+"&z="+zoom

                window.open(url)
            })

            btn.addEventListener("click", () => {
                if (!now) return
                if (!confirm("Terminer l'évènement " + event.name + " ?")) return
                query("r_endevent", {event_id: event.id}).then(() => {
                    alert("Évènement terminé.")
                    ctrl("reload")
                    load_events()  
                })
            });

            box_events.appendChild(btn)
        })
    })
}
load_events()

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

    return div
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

click("color-preset", () => {
    if (!confirm("Save as preset ?")) return;
    const name = prompt("Preset name", "preset-color")

    const colors = [...colors_container.querySelectorAll(".selected")].map(e => e.style.backgroundColor);
    const args = {
        colors : colors,
        params : getParams("color")
    }
    
    saveAsPresset("color", args, name)
})

function load_preset_colors(data) {
    data=data.args
    const cols = colors_container.querySelectorAll("div")
    cols.forEach(e => {e.classList.remove("selected")})

    data.colors.forEach(col => {
        cols.forEach(e => {
            if (e.style.backgroundColor == col) e.classList.add("selected")
        })
    })
}

/* Text event */
/* */

const text_input = document.getElementById("input-text-addtext")
const tem_textitem = document.getElementById("template-text-item")
const texts_container = document.getElementById("box-text-items")

function add_text(txt) {
    // const txt = text_input.value
    const tem = tem_textitem.cloneNode(true).content.querySelector(".input_field")
    tem.querySelector("input").value = txt
    tem.querySelector("button").addEventListener("click", () => {
        tem.remove()
    })
    texts_container.appendChild(tem)
}

click("text-add", () => {
    add_text(text_input.value)
})

click("text-send", () => {
    const texts = [...texts_container.querySelectorAll(".input_field")].map(e => e.querySelector("input").value);
    const args = {
        texts : texts,
        params : getParams("text")
    }
    ctrl("text", args)
})

click("text-preset", () => {
    if (!confirm("Save as preset ?")) return;
    const name = prompt("Preset name", "preset-text")

    const texts = [...texts_container.querySelectorAll(".input_field")].map(e => e.querySelector("input").value);
    const args = {
        texts : texts,
        params : getParams("text")
    }
    
    saveAsPresset("text", args, name)
})

function load_preset_text(data) {
    data=data.args
    texts_container.innerHTML = ""
    data.texts.forEach(txt => {
        add_text(txt)
    })
}

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

click("image-preset", () => {
    if (!confirm("Save as preset ?")) return;
    const name = prompt("Preset name", "preset-text")

    const images = [...images_container.querySelectorAll("img")].map(e => e.src)
    const args = {
        images : images,
        params : getParams("image")
    }
    
    saveAsPresset("image", args, name)
})

function load_preset_images(data) {
    data=data.args
    images_container.innerHTML = ""
    data.images.forEach(image => {
        const img = document.createElement("img")
        img.src = image
        images_container.appendChild(img)
        img.addEventListener("click", () => {
            images_container.removeChild(img)
        })
    })
}

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

click("info-preset", () => {
    if (!confirm("Save as preset ?")) return;
    const name = prompt("Preset name", "preset-text")

    const val = document.getElementById("textarea-info").value
    const args = {
        message : val,
        params : {}
    }
    
    saveAsPresset("info", args, name)
})

function load_preset_info(data) {
    data=data.args
    document.getElementById("textarea-info").value = data.message
}

/* Videos */
/* */

const video_preview = document.getElementById("video-event-preview")
const video_input = document.getElementById("input-video-addvideo")
const video_add = document.getElementById("btn-video-add")

click("video-add", () => {
    const url = video_input.value
    video_preview.src = url
    video_preview.load();
})

video_preview.addEventListener('loadeddata', function() {
    video_preview.play();
}, false);

click("video-send", () => {
    const url = video_input.value
    const args = {
        url : url,
        params : getParams("video")
    }
    ctrl("video", args)
})

click("video-preset", () => {
    if (!confirm("Save as preset ?")) return;
    const name = prompt("Preset name", "preset-video")

    const url = video_input.value
    const args = {
        url : url,
        params : getParams("video")
    }
    
    saveAsPresset("video", args, name)
})

function load_preset_video(data) {
    data=data.args
    video_input.value = data.url
    video_preview.src = data.url
    video_preview.load();
}

/* Presets */
/* */

function saveAsPresset(type, args, presetName) {
    
    const tribe = document.getElementById("select-group").value
    args.params.tribe = tribe

    const data = JSON.stringify({
        name: type,
        args: args
    })

    // Preset.list
    query("r_new_preset", {
        name: presetName,
        group: document.getElementById("text-preset-savegroup").value,
        data: data
    }).then(() => {
        alert("Preset '" + presetName + "' saved.")
        loadPresets()
    })
}

const presets_container = document.getElementById("presets-container")
const presetList = document.getElementById("select-preset")
let presetGroups = {};

function loadPresets() {
    presetList.innerHTML = "";
    presets_container.innerHTML = "";
    presetGroups = {};
    query("r_get_presets").then((res) => {
        const data = res.data
        const groups = data.reduce((acc, elem) => {
            if (!acc[elem.group]) {
                acc[elem.group] = []
            }
            acc[elem.group].push(elem)
            return acc
        }, {})

        presetGroups = groups;
        
        for (const group in groups) {
            const data = groups[group]
            const opt = document.createElement("option")
            opt.value = group
            opt.innerHTML = group
            presetList.appendChild(opt)
        }

        if (presetList.options.length>0) {
            loadGroup(presetList.options[0].value)
        }
    })
}
loadPresets();

function loadGroup(name) {
    const group = presetGroups[name]

    group.forEach((elem) => {
        const container = document.createElement("div")
        container.classList.add("input_field")

        // Preset button
        const btn = document.createElement("button")
        btn.classList.add("preset-btn")

        const data = JSON.parse(elem.data)

        const icon = document.querySelector("[data-page-id=" + data.name + "]:not(.page)").querySelector("svg").cloneNode(true)

        btn.appendChild(icon)
        btn.innerHTML += elem.name

        btn.addEventListener("click", () => {
            ctrl(data.name, data.args)
        })

        container.appendChild(btn)

        // Copy button
        const copyBtn = document.createElement("button")
        copyBtn.innerHTML = "Copy"

        copyBtn.addEventListener("click", () => {
            load_preset(data)
        })

        container.appendChild(copyBtn)

        presets_container.appendChild(container)
    })
}

presetList.addEventListener("change", () => {
    presets_container.innerHTML = "";
    loadGroup(presetList.value)
})

function load_preset(data) {
    PAGES.goto(data.name)
    switch(data.name) {
        case "color":
            load_preset_colors(data)
            break;
        case "text":
            load_preset_text(data)
            break;
        case "image":
            load_preset_images(data)
            break;
        case "info":
            load_preset_info(data)
            break;
        case "video":
            load_preset_video(data)
            break;
    }

    if (data.args.params.tribe) {
        document.getElementById("select-group").value = data.args.params.tribe
    }

    const page = document.querySelector(".page[data-page-id='"+ data.name +"']")

    for (const i in data.args.params) {
        const el = page.querySelector("[data-param='" + i + "']")
        if (el) el.checked = data.args.params[i]
    }
}

/* Additional inputs */

click("end-current-event", () => {
    ctrl("end")
})

click("reload-event", () => {
    if (confirm("Reload page for everyone ?"))
    ctrl("reload")
})

/*
document.addEventListener("touchstart", () => {
    const el = document.documentElement;
    const rfs = el.requestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen || el.msRequestFullscreen
    if (rfs) {
        rfs.call(el)
    }
    else if (window.parent !== window) {
        parent.postMessage('fullscreen', '*')
    }  
})
*/

// setEventState

click("set-event-state", () => {
    if (!confirm("Update event state ?")) return
    current_event_state = !current_event_state
    // setEventBtnState(current_event_state)
    socket.emit('setEventState', current_event_state)
});

socket.on("getEventState", (state)=> {
    setEventBtnState(state)
    log(`${log_time()} [EVENT STATE] : ${state}`)
})

function setEventBtnState(state) {
    current_event_state = state
    const btn = document.getElementById("btn-set-event-state")
    btn.innerHTML = state ? "STOP EVENT" : "START EVENT"
}

/* Select group */

const select_usergroup = document.getElementById("select-group")

function fill_select_usergroup() {
    select_usergroup.innerHTML = ""

    const opt = document.createElement("option")
    opt.value = ""
    opt.innerHTML = "Everyone"
    select_usergroup.appendChild(opt)

    query("r_tribelist").then((res) => {
        res.data.forEach((g) => {
            const opt = document.createElement("option")
            opt.value = g.name
            opt.innerHTML = g.name
            select_usergroup.appendChild(opt)
        })
    })
}

fill_select_usergroup()