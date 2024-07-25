
// connect socket.io
// query image list
// show thumbnail and URL
// copy URL to clipboard on click


// SOCKETIO INIT
//
const socket = io();
socket.on('connect', () => {
    console.log("Connected to server");
    socket.emit("get-image-list");
});

socket.on('image-list', (images) => {
    console.log("Image list received : ", images);
    const container = document.getElementById("image-selection");
    container.innerHTML = "";
    images.forEach((image) => {
        const div = document.createElement("div");
        div.classList.add("image-thumbnail");
        div.style.backgroundImage = "url("+image+")";
        div.addEventListener("click", () => {
            navigator.clipboard.writeText(window.location.origin + image).then(() => {
                console.log('URL copied to clipboard', window.location.origin + image);
                document.getElementById("copied").style.display = "block";
                setTimeout(() => {
                    document.getElementById("copied").style.display = "none";
                }, 1000);
            })
        });
        container.appendChild(div);
    });
})