const socket = io();
document.getElementById("send_msg").addEventListener("click", (e)=>{
    let message = document.getElementById("message").value
    socket.emit("chat_msg", message)
})

