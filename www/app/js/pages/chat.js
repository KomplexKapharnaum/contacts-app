// const chat_container = document.getElementById("chat-container")
// const template_chat_message = document.getElementById("template-chat-container")

// function displayMessage(data) {
//     const name = data.name
//     const message = data.message
//     const date = data.date
//     const clone = template_chat_message.cloneNode(true).content
//     clone.querySelector(".content").innerText = message
//     clone.querySelector(".message").dataset.id = data.id
    
//     const order = new Date(date).getTime().toString().slice(5)

//     if (data.admin) {
//         const msg = clone.querySelector(".message")
//         msg.classList.add("admin")
//         msg.style.zIndex = order
//     }

//     const btn_report = clone.querySelector(".report")
//     const btn_delete = clone.querySelector(".delete")
//     if (userData.public_id == data.public_id) {
//         btn_report.remove()
//         btn_delete.addEventListener("click", () => {
//             app_confirm("Voulez-vous supprimer ce message ?").then((res) => {
//                 PAGES.goto("chat")
//                 if (res) {
//                     document.SOCKETIO.emit("delete-message", data.id)
//                 }
//             })
//         })
//     } else {
//         btn_delete.remove()
//         btn_report.addEventListener("click", () => {
//             app_confirm("Voulez-vous signaler ce message ?").then((res) => {
//                 PAGES.goto("chat")
//                 if (res) {
//                     document.SOCKETIO.emit("report-message", data.id)
//                 }
//             })
//         })
//     }

//     const parsedDate = new Date(date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
//     clone.querySelector(".pseudo").innerText = parsedDate + " - " + name
//     clone.querySelector(".message").style.order = order
//     chat_container.appendChild(clone)

//     chat_container.scrollTo({
//         top: chat_container.scrollHeight,
//         behavior: 'smooth'
//     })
// }

// const chat_text_input = document.getElementById("chat-input")
// const chat_send_button = document.getElementById("chat-send")

// function sendMessage() {
//     const message = chat_text_input.value
//     if (message) {
//         chat_text_input.value = ""
//         const date = new Date()
//         document.SOCKETIO.emit("chat-message", {name: userData.name, message: message})
//     }
// }

// chat_send_button.addEventListener("click", () => {
//     sendMessage()
// })

// chat_text_input.addEventListener("keydown", (event) => {
//     if (event.key === "Enter") {
//         sendMessage()
//     }
// })

// async function initMessages() {
//     messagesLoaded = true;
//     const msgs = await QUERY.getMessages();
//     for (const msg of msgs.data) {
//         displayMessage(msg)
//     }
// }

// var messagesLoaded = false
// PAGES.addCallback("chat", () => {
//     if (userData && !messagesLoaded) initMessages()
// })

// document.SOCKETIO.on("chat-message", (data) => {
//     if (messagesLoaded) displayMessage(data)
// })

// document.SOCKETIO.on("delete-message", (id) => {
//     if (!messagesLoaded) return
//     const msg = chat_container.querySelector(`.message[data-id="${id}"]`)
//     if (msg) msg.remove()
// })

/* === New chatbox system === */

class ChatBox {
    tem_msg=document.getElementById("tem-chatbox-message")
    constructor(msg_container, send_button, input, tribeID) {
        this.msg_container = msg_container
        this.send_button = send_button
        this.input = input
        this.tribeID = tribeID

        this.send_button.addEventListener("click", () => {
            this.sendMessage()
        })

        this.input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.sendMessage()
                this.input.blur()
            }
        })

        document.SOCKETIO.on("chat-message", (data) => {
            if (data.tribeID == this.tribeID) {
                this.addMessage(data)
            }
        })

        this.initMessages()
    }

    sendMessage() {
        const message = this.input.value
        if (message) {
            this.input.value = ""
            document.SOCKETIO.emit("chat-message", {name: userData.name, message: message, tribeID: this.tribeID})
        }
    }

    addMessage(data) {
        const clone = this.tem_msg.cloneNode(true).content.querySelector(".message-container")
        clone.querySelector(".content").innerText = data.message
        clone.querySelector(".username").innerText = data.name
        const formattedDate = new Date(data.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
        clone.querySelector(".date").innerText = formattedDate;

        const time = new Date(data.date).getTime().toString().slice(3).slice(0, -2)
        clone.style.order = time

        const report = clone.querySelector(".report")
        if (data.admin) {
            report.remove()
            clone.classList.add("admin")
            // unstick message on click
            clone.addEventListener("click", () => {
                clone.classList.remove("admin")
                clone.classList.add("adminsoft")
            })
        } else {
            report.addEventListener("click", () => {
                app_confirm("Vous êtes sur le point de signaler ce message : " + data.message).then((res) => {
                    if (res) {
                        clone.remove();
                        document.SOCKETIO.emit("report-message", data.id);
                    }
                    PAGES.goto("cyberspace")
                })
            })
        }

        this.msg_container.appendChild(clone)
        this.msg_container.scrollTo({
            top: this.msg_container.scrollHeight,
            behavior: 'smooth'
        })
    }

    async initMessages() {
        if (!userData) return
        const msgs = await QUERY.getMessages(this.tribeID)
        for (const msg of msgs.data) {
            this.addMessage(msg)
        }
    }
}

function loadChats(tribeID) {  
    new ChatBox(
        document.getElementById("chatbox-cyberspace"), 
        document.getElementById("btn-cyberspace-send"), 
        document.getElementById("input-cyberspace-message"), 
        0
    )
    // new ChatBox(
    //     document.getElementById("chatbox-tribe"), 
    //     document.getElementById("btn-tribe-send"), 
    //     document.getElementById("input-tribe-message"), 
    //     tribeID
    // )
}