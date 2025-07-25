/* Configuration */
/* */

const config = {
    base_colors: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF", "#FFFFFF"]
}

/* Config */
/* */
if (!document.CONFIG) {
    console.log("CONFIG: will use browser cookies")
    document.CONFIG = {
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

if (!document.CONFIG.get('pass')) {
    password = prompt("Password", "")
    document.CONFIG.set('pass', password, { expires: 10 })
}
var password = document.CONFIG.get('pass')

/* Socket handler */
/* */

// Connect Socketio (if not already exists)
if (!document.SOCKETIO) 
{
    document.SOCKETIO = io(document.WEBAPP_URL)
    document.SOCKETIO.connected = false;

    document.SOCKETIO.on('connect', function () {
        console.log('SOCKETIO: Connected to server');
        document.SOCKETIO.connected = 1;
    });
    document.SOCKETIO.on('disconnect', function () {
        console.log('SOCKETIO: Disconnected from server');
        document.SOCKETIO.connected = 0;
    });
}

document.SOCKETIO.on('hello', () => {
    log("Connexion established with server");
    document.SOCKETIO.emit('admin-auth', password);
})

document.SOCKETIO.on('admin-auth-failed', () => {
    log("Admin authentication failed");
    document.CONFIG.remove('pass')
    setTimeout(() => {
        location.reload();
    }, 1000);
})

function ctrl(name, args = {params:{}}) {

    // if (!current_event_state) {
    //     log(log_time() + " Event not live, aborting.")
    //     return;
    // }

    var resid = Math.random().toString(36).substring(2);

    if (!args.params.tribe) {
        const tribe = document.getElementById("select-group").value
        args.params.tribe = tribe
    }

    document.SOCKETIO.emit('ctrl', {
        name: name,
        args: args?args:{},
        resid: resid
    })

    document.SOCKETIO.once('event-ok-' + resid, (data) => { 
        log(data)
    })
}

// let current_event_state = false
// document.SOCKETIO.on("adminEventState", (eventState) => {
//     current_event_state = eventState
//     setEventBtnState(eventState)
// })

/*
query = function (name, ...args) {
    var resid = Math.random().toString(36).substring(2);
    document.SOCKETIO.emit('query', {
        name: name,
        args: args,
        resid: resid
    });
    var p = new Promise((resolve, reject) => {
        document.SOCKETIO.once('ok-' + resid, (data) => { resolve(data) })
        document.SOCKETIO.once('ko-' + resid, (data) => { reject(data) })
    })
    return p
}
*/

async function query(name, params={}) {
    params.pass = document.CONFIG.get('pass');
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(document.WEBAPP_URL+`/query?queryname=${name}&${queryString}`)
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

        if (events.data == "wrong password") {
            document.CONFIG.remove('pass')
            location.reload();
        }

        if (!events.status) return;
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

click("color-add", () => {
    const val = document.getElementById("input-color-addcolor").value;
    add_color(val);
})

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
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-color")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-color")
    }
    if (!name) return;

    const colors = [...colors_container.querySelectorAll(".selected")].map(e => e.style.backgroundColor);
    const args = {
        colors : colors,
        params : getParams("color")
    }
    
    saveAsPresset("color", args, name)
})

function rgbToHex(rgb) {
    if (rgb.startsWith("#")) return rgb;
    const [r, g, b] = rgb.replace("rgb(", "").replace(")", "").split(",").map(x => parseInt(x));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function load_preset_colors(data) {

    data=data.args

    colors_container.innerHTML = ""
    config.base_colors.forEach(col => {
        add_color(col)
    })

    data.colors.forEach(col => {
        const hex = rgbToHex(col);
        if (!config.base_colors.includes(hex.toUpperCase())) add_color(hex.toUpperCase())
    })
    
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
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-text")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-text")
    }
    if (!name) return;

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
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-image")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-image")
    }
    if (!name) return;

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
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-info")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-info")
    }
    if (!name) return;

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
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-video")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-video")
    }
    if (!name) return;

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

/* Questions */
/* */

const question_input = document.getElementById("input-question-text")
const questions_container = document.getElementById("box-question-items")

function add_question(txt) {
    const tem = tem_textitem.cloneNode(true).content.querySelector(".input_field")
    tem.querySelector("input").value = txt
    tem.querySelector("button").addEventListener("click", () => {
        tem.remove()
    })
    questions_container.appendChild(tem)
}

click("question-add", () => {
    add_question(question_input.value)
})

click("question-send", () => {
    const questions = [...questions_container.querySelectorAll(".input_field")].map(e => e.querySelector("input").value);
    const args = {
        questions,
        params: getParams("questions")
    }
    ctrl("question", args)
})

click("question-preset", () => {
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-question")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-question")
    }
    if (!name) return;

    const questions = [...questions_container.querySelectorAll(".input_field")].map(e => e.querySelector("input").value);
    const args = {
        texts : questions,
        params : getParams("questions")
    }
    
    saveAsPresset("questions", args, name)
})

function load_preset_question(data) {
    console.log(data)
    data = data.args
    questions_container.innerHTML = ""
    data.texts.forEach(txt => {
        add_question(txt)
    })
}

/* Live upload */
/* */

click("upload-send", () => {
    const args = {params : {}}
    ctrl("upload", args)
})

/* Tribe cry */
click("cry-send", () => {
    const args = {params : {}}
    ctrl("cry", args)
})

/* Flashlight */
click("flashlight-send", () => {
    const args = {params : {}}
    ctrl("flashlight", args)
})

/* Games */
const gameList = [
    {name: "Kpad", id: "kpad"},
    {name: "Couleur tribu", id: "tribe_color"},
    {name: "Sélecteur d'images", id: "images"},
    {name: "Vidéo boucle tribu", id: "videoloop"}
]

const game_select_input = document.getElementById("input-games-select")
function loadGameList() {
    gameList.forEach(game => {
        const option = document.createElement("option")
        option.value = game.id
        option.innerHTML = game.name
        game_select_input.appendChild(option)
    })
}
loadGameList()

click("game-send", () => {
    const game = game_select_input.value
    const args = {params : {}, gameid: game}
    ctrl("game", args)
})

click("game-preset", () => {
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-game")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-game")
    }
    if (!name) return;

    const game = game_select_input.value
    const args = {params : {}, gameid: game}
    
    saveAsPresset("game", args, name)
})

function load_preset_game(data) {
    console.log(data)
    data = data.args
    game_select_input.value = data.gameid
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
        if (!res.status) return;
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

let updateName = false
function loadGroup(name) {
    const group = presetGroups[name]

    const ordered = group.sort((a, b) => a.name.localeCompare(b.name))

    ordered.forEach((elem) => {
        const container = document.createElement("div")
        container.classList.add("input_field")

        // args
        const data = JSON.parse(elem.data)

        // Preset button
        const btn = document.createElement("button")
        btn.classList.add("preset-btn")
        if (data.args.params.tribe) 
            btn.classList.add("tribe-" + data.args.params.tribe)

        const icon = document.querySelector("[data-page-id=" + data.name + "]:not(.page)")
        if (icon) btn.appendChild(icon.querySelector("svg").cloneNode(true))
        btn.innerHTML += elem.name

        btn.addEventListener("click", () => {
            ctrl(data.name, data.args)
        })

        container.appendChild(btn)

        // Copy button
        const copyBtn = document.createElement("button")
        copyBtn.innerHTML = "Update"
        copyBtn.addEventListener("click", () => {
            load_preset(data)
            updateName = elem.name
        })
        container.appendChild(copyBtn)

        // Delete button
        const deleteBtn = document.createElement("button")
        deleteBtn.innerHTML = "X"
        deleteBtn.addEventListener("click", () => {
            if (!confirm("Delete preset " + elem.name + " ?")) return;
            query("r_delete_preset", {
                id: elem.id
            }).then(() => {
                loadPresets()
            })
        })
        container.appendChild(deleteBtn)

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
        case "questions":
            load_preset_question(data)
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

// click("set-event-state", () => {
//     if (!confirm("Update event state ?")) return
//     current_event_state = !current_event_state
//     // setEventBtnState(current_event_state)
//     document.SOCKETIO.emit('setEventState', current_event_state)
// });

// document.SOCKETIO.on("getEventState", (state)=> {
//     setEventBtnState(state)
//     log(`${log_time()} [EVENT STATE] : ${state}`)
// })

// function setEventBtnState(state) {
//     current_event_state = state
//     const btn = document.getElementById("btn-set-event-state")
//     btn.innerHTML = state ? "STOP EVENT" : "START EVENT"
// }

/* Select group */

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

/* Notifications */

// const input_notification_text = document.getElementById("input-notification-text")
// const input_notification_color = document.getElementById("select-notification-color")
// const send_notification = document.getElementById("btn-notificaton-send")
// const input_notification_add_to_chat = document.getElementById("checkbox-notification-add-to-chat")

// send_notification.addEventListener("click", () => {
//     if (!confirm("Send notification ?")) return
//     const text = input_notification_text.value
//     const color = input_notification_color.value

//     const tribe = document.getElementById("select-group").value
//     document.SOCKETIO.emit('new-notification', {
//         text,
//         add_to_chat: input_notification_add_to_chat.checked,
//         color,
//         tribe
//     })

//     document.SOCKETIO.once("notification-validation", () => {
//         alert("Notification sent !")
//         input_notification_text.value = ""
//         input_notification_color.value = "cyberspace"
//         input_notification_add_to_chat.checked = false
//     })
// })

/* Feedbacks */

// const feedbacks_container = document.getElementById("feedback-container")

// function load_feedbacks() {
//     feedbacks_container.innerHTML = ""
//     query("r_getfeedbacks").then((res) => {
//         res.data.forEach((f) => {
//             const el = document.getElementById("tem-feedback").cloneNode(true).content
//             el.querySelector("label").innerHTML = `[${f.username}] ${f.message}`
//             const item = el.querySelector(".feedback-item")
//             item.style.order = f.status
            
//             const checkbox = el.querySelector("input")
//             checkbox.checked = f.status
//             checkbox.addEventListener("click", () => {
//                 const newStatus = checkbox.checked ? 1 : 0
//                 query("r_updatefeedback", {
//                     id: f.id,
//                     status: newStatus
//                 }).then(() => {
//                     item.style.order = newStatus
//                 })
//             })
//             feedbacks_container.appendChild(el)
//         })
//     })
// }
// load_feedbacks()

/* Features */

// const features_container = document.getElementById("feature-container")

// function load_features() {

//     fetch('/features').then(res => res.json())
//     .then(res => {
//         for (let [key, value] of Object.entries(res)) {
//             const el = document.getElementById("tem-feature").cloneNode(true).content
//             el.querySelector("label").innerHTML = key
//             const checkbox = el.querySelector("input")
//             checkbox.checked = value
//             checkbox.addEventListener("click", () => {
//                 const newStatus = checkbox.checked ? 1 : 0
//                 query("r_updatefeature", {
//                     name: key,
//                     status: newStatus
//                 }).then((res) => {
//                     if (res.status) {
//                         alert(`${res.data.name} changed to ${res.data.status}`)
//                     } else {
//                         alert("error updating state.")
//                     }
//                 })
//             })
//             features_container.appendChild(el)
//         }
//     })

//     features_container.innerHTML = ""
//     query("r_getfeatures").then((res) => {
//         res.data.forEach((f) => {
//             const el = document.getElementById("tem-feature").cloneNode(true).content
//             el.querySelector("label").innerHTML = `[${f.username}] ${f.message}`
//             const item = el.querySelector(".feature-item")
//             item.style.order = f.status
            
//             const checkbox = el.querySelector("input")
//             checkbox.checked = f.status
//             checkbox.addEventListener("click", () => {
//                 const newStatus = checkbox.checked ? 1 : 0
//                 query("r_updatefeature", {
//                     id: f.id,
//                     status: newStatus
//                 }).then(() => {
//                     item.style.order = newStatus
//                 })
//             })
//             features_container.appendChild(el)
//         })
//     })

    
// }
// load_features()

/* Other presets */

click("upload-preset", () => {
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-upload")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-upload")
    }
    if (!name) return;

    saveAsPresset("upload", {params:{}}, name)
})

click("cry-preset", () => {
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-cry")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-cry")
    }
    if (!name) return;

    saveAsPresset("cry", {params:{}}, name)
})

click("flashlight-preset", () => {
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-flashlight")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-flashlight")
    }
    if (!name) return;

    saveAsPresset("flashlight", {params:{}}, name)
})

click("stop-preset", () => {
    let name;
    if (updateName) {
        if (confirm("update preset" + updateName + " ?")) {
            name = updateName
        } else {
            name = prompt("Preset name", "preset-end")
        }
    } else {
        if (!confirm("Save as preset ?")) return;
        name = prompt("Preset name", "preset-end")
    }
    if (!name) return;

    saveAsPresset("end", {params:{}}, name)
})