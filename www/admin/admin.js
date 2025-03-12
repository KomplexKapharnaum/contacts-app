flatpickr("input[type=datetime-local]", {
    enableTime: true
});

/* === Auth & cookies === */

const cookies = {
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
        console.log("Cookies: set", name, value)
    },
    remove: function(name) {
        document.cookie = name+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        console.log("Cookies: removed", name)
    }
}

var pass;
if (!cookies.get('pass')) {
    pass = prompt("Password", "")
    cookies.set('pass', pass, { expires: 10 })
} else {
    pass = cookies.get('pass')
}

async function sendCommand(name, params) {
    params.pass = cookies.get('pass')
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`/query?queryname=${name}&${queryString}`);
    const json = await res.json()
    return {
        status: res.status===200,
        data: json
    }
}

const socket = io()

socket.on('hello', () => {
    console.log("Connexion established with server");
    socket.emit('admin-auth', pass);
})

/* === Notifications === */
const sendNotificationButton = document.getElementById("btn-notificaton-send");
const notificationTextInput = document.getElementById("input-notification-text");
const notificationColorSelect = document.getElementById("select-notification-color");
const notificationAddToChatCheckbox = document.getElementById("checkbox-notification-add-to-chat");

sendNotificationButton.addEventListener("click", async (e) => {
    if (!confirm("Send notification ?")) return
    e.preventDefault();
    const notificationData = {
        text: notificationTextInput.value,
        color: notificationColorSelect.value,
        add_to_chat: notificationAddToChatCheckbox.checked 
    };
    const res = await sendCommand("admin_send_notification", notificationData);
    if (!res.status) return;

    notificationTextInput.value = "";
    notificationColorSelect.value = "cyberspace";
    notificationAddToChatCheckbox.checked = false;
});

/* === Evenements === */
const createEventButton = document.getElementById("btn-event-create");
const eventStartDateInput = document.getElementById("input-event-start-date");
const eventLocationCoordsInput = document.getElementById("input-event-location-coords");
const eventLocationNameInput = document.getElementById("input-event-location-name");
const eventNameInput = document.getElementById("input-event-name");

createEventButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const eventData = {
        start_date: eventStartDateInput.value,
        location_coords: eventLocationCoordsInput.value,
        location_name: eventLocationNameInput.value,
        name: eventNameInput.value
    };

    const res = await sendCommand("admin_create_event", eventData);
    if (!res.status) return;

    eventStartDateInput.value = "";
    eventLocationCoordsInput.value = "";
    eventLocationNameInput.value = "";
    eventNameInput.value = "";
});

/* Features */
const featureTemplate = document.getElementById("feature-template");
const featuresContainer = document.getElementById("feature-container");

async function loadFeatures() {
    const features = await sendCommand("admin_get_features", {});
    if (!features.status) return;

    featuresContainer.innerHTML = ""; // Clear existing features

    features.data.forEach(feature => {
        const clone = featureTemplate.cloneNode(true).content;
        const checkbox = clone.querySelector("input[type=checkbox]");
        const label = clone.querySelector(".feature-desc");

        checkbox.name = feature.name;
        checkbox.checked = feature.enabled;
        label.textContent = feature.description;

        checkbox.addEventListener("change", async () => {
            const newStatus = checkbox.checked ? 1 : 0;
            const res = await sendCommand("admin_update_feature", { name: feature.name, enabled: newStatus });
            if (!res.status) return;
            alert(`${feature.description} changed to ${newStatus}`);
        });

        featuresContainer.appendChild(clone);
    });
}

loadFeatures();

const chatMessageTemplate = document.getElementById("chat-message-template");
const chatContainer = document.getElementById("chat-container");

function addMessage(message) {
    console.log(message);
    const clone = chatMessageTemplate.cloneNode(true).content;
    const username = clone.querySelector(".username");
    const content = clone.querySelector(".content");

    username.textContent = message.name;
    content.textContent = message.message;
    
    const msg = clone.querySelector(".message");
    msg.addEventListener("click", async () => {
        if (!confirm("Remove : " + message.message)) return
        const res = await sendCommand("admin_delete_message", { id: message.id });
        if (!res.status) return;
        msg.remove();
    })

    chatContainer.appendChild(clone);

    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

async function loadChat() {
    const messages = await sendCommand("admin_get_chat", {});
    if (!messages.status) return;

    chatContainer.innerHTML = "";

    messages.data.forEach(message => {
        addMessage(message);
    });
}

loadChat();

socket.on("chat-message", (data) => {
    addMessage(data);
});

async function loadTable(name, parent, structure) {
    const list = await sendCommand("admin_getall", {table: name});
    if (!list.status) return;

    list.data.forEach(element => {
        console.log(element);
        createForm(structure, parent, name, element);
    });
}

function createForm(structure, parent, tablename, data) {
    const holder = document.createElement("div")
    holder.classList.add("form")

    structure.forEach(element => {
        const input = document.createElement("input")
        input.type = element.type
        input.name = element.key
        input.placeholder = element.placeholder

        if (element.type == "datetime-local") {
            flatpickr(input, {
                enableTime: true
            });
        }

        input.value = data[element.key]

        holder.appendChild(input)
    });

    const btn_update = document.createElement("button")
    btn_update.textContent = "Update"
    btn_update.addEventListener("click", async () => {
        if (!confirm("Update ?")) return
        const data = {}
        structure.forEach(element => {
            data[element.key] = holder.querySelector(`input[name=${element.key}]`).value
        });
        const req = {
            table: tablename,
            data: JSON.stringify(data),
            id: data.id
        }
        const res = await sendCommand("admin_update", req);
        if (!res.status) return;
        alert("Updated !")
    })

    const btn_delete = document.createElement("button")
    btn_delete.textContent = "Delete"
    btn_delete.addEventListener("click", async () => {
        if (!confirm("Delete ?")) return
        const res = await sendCommand("admin_delete", { table: tablename, id: data.id });
        if (!res.status) return;
        alert("Deleted !")
        holder.remove()
    })

    holder.appendChild(btn_update)
    holder.appendChild(btn_delete)

    parent.appendChild(holder)
}

const structure_event = [
    {
        key: "start_date",
        type: "datetime-local",
        placeholder: "Start date"
    },
    {
        key: "location_coords",
        type: "text",
        placeholder: "Location coordinates (long,lat)"
    },
    {
        key: "location_name",
        type: "text",
        placeholder: "Location name"
    },
    {
        key: "description",
        type: "text",
        placeholder: "Event description"
    },
    {
        key: "name",
        type: "text",
        placeholder: "Event name"
    }
]
const box_events = document.getElementById("box-events")
loadTable("event", box_events, structure_event)

const structure_notification = [
    {
        key: "message",
        type: "text",
        placeholder: "Notification text"
    },
    {
        key: "color",
        type: "text",
        placeholder: "Notification color"
    }
]
const box_notifications = document.getElementById("box-notifcations")
loadTable("notifications", box_notifications, structure_notification)

const loadEventMessages = async () => {
    const list = await sendCommand("admin_getall", {table: "live-answers"});
    if (!list.status) return;

    const template = document.getElementById("chat-livemsg-template");
    const container = document.getElementById("live-msgs-container");
    list.data.forEach(element => {
        const clone = template.content.cloneNode(true);
        clone.querySelector(".question").textContent = element.question;
        clone.querySelector(".answer").textContent = element.answer;
        container.appendChild(clone);
    });
}
loadEventMessages();

document.getElementById("download-all-live-questions").addEventListener("click", async () => {
    const msgs = await sendCommand("admin_download_questions", {});
    if (!msgs.status) return;
    const blob = new Blob([msgs.data], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'messages.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
})

const feedbacks_container = document.getElementById("feedback-container")

const load_feedbacks = async () => {
    feedbacks_container.innerHTML = "";
    const res = await sendCommand("admin_getfeedbacks", {});
    res.data.forEach(f => {
        const el = document.getElementById("tem-feedback").cloneNode(true).content;
        el.querySelector("label").innerHTML = `[${f.username}] ${f.message}`;
        const item = el.querySelector(".feedback-item");
        item.style.order = f.status;

        const checkbox = el.querySelector("input");
        checkbox.checked = f.status;
        checkbox.addEventListener("click", async () => {
            const newStatus = checkbox.checked ? 1 : 0;
            await sendCommand("admin_updatefeedback", {
                id: f.id,
                status: newStatus
            });
            item.style.order = newStatus;
        });
        feedbacks_container.appendChild(el);
    });
}
load_feedbacks();

