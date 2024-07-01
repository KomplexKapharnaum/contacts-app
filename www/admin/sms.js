
document.getElementById("manuel").addEventListener('click', (e) => {
    document.getElementById("num_sms").disabled = false;
    document.getElementById("groupe_sms").disabled = true;
})
document.getElementById("all").addEventListener('click', (e) => {
    document.getElementById("num_sms").disabled = true;
    document.getElementById("groupe_sms").disabled = true;
})
document.getElementById("groupe").addEventListener('click', (e) => {
    document.getElementById("num_sms").disabled = true;
    document.getElementById("groupe_sms").disabled = false;
})

document.getElementById('test').addEventListener('click', (e) => {
    doSend()
})
function doSend() {

    const socket = io();

    let current = document.querySelector('input[name="groupe"]:checked').value;
    
    let txt = document.getElementById('msg_sms').value
    // only one number
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
        socket.emit("sms", txt, "groupe")
    }
}