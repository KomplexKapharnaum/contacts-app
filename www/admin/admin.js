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
    const json = await res.json();
    return json;
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
    if (res[0] == false) return;

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
    if (res[0] == false) return;

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
    if (!features) return;

    featuresContainer.innerHTML = ""; // Clear existing features

    features.forEach(feature => {
        const clone = featureTemplate.cloneNode(true).content;
        const checkbox = clone.querySelector("input[type=checkbox]");
        const label = clone.querySelector(".feature-desc");

        checkbox.name = feature.name;
        checkbox.checked = feature.enabled;
        label.textContent = feature.description;

        checkbox.addEventListener("change", async () => {
            const newStatus = checkbox.checked ? 1 : 0;
            const res = await sendCommand("admin_update_feature", { name: feature.name, enabled: newStatus });
            if (res[0] == false) return;
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
        if (res[0] == false) return;
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
    if (!messages) return;

    chatContainer.innerHTML = "";

    messages.forEach(message => {
        addMessage(message);
    });
}

loadChat();

socket.on("chat-message", (data) => {
    addMessage(data);
});