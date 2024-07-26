
// connect socket.io
// query image list
// show thumbnail and URL
// copy URL to clipboard on click

// Media type from url
function mediaType(url) {
    const ext = url.split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        return 'image';
    }
    else if (['mp4', 'webm', 'ogg'].includes(ext)) {
        return 'video';
    }
    else if (['mp3', 'wav', 'aac'].includes(ext)) {
        return 'audio';
    }
    return 'unknown';
}


// SOCKETIO INIT
//
const socket = io();
socket.on('connect', () => {
    console.log("Connected to server");
    socket.emit("get-media-list");
});

// socket.on('media-list', (images) => {
//     console.log("Image list received : ", images);
//     const container = document.getElementById("image-selection");
//     container.innerHTML = "";
//     images.forEach((image) => {
//         const div = document.createElement("div");
//         div.classList.add("media-thumbnail");
//         div.style.backgroundImage = "url("+image+")";
//         div.addEventListener("click", () => {
//             navigator.clipboard.writeText(window.location.origin + image).then(() => {
//                 console.log('URL copied to clipboard', window.location.origin + image);
//                 document.getElementById("copied").style.display = "block";
//                 setTimeout(() => {
//                     document.getElementById("copied").style.display = "none";
//                 }, 1000);
//             })
//         });
//         container.appendChild(div);
//     });
// })

socket.on('media-list', (media) => {
    console.log("Media list received : ", media);
    const container = document.getElementById("media-selection");
    container.innerHTML = "";
    media.forEach((m) => {
        const div = document.createElement("div");
        div.classList.add("media-thumbnail");

        // add title
        const title = document.createElement("div");
        title.classList.add("media-thumbnail-title");
        title.innerText = m.split('/').pop();
        div.appendChild(title);

        const type = mediaType(m);
        if (type === 'image') {
            div.classList.add("media-thumbnail-image");
            div.style.backgroundImage = "url("+m+")";
        }
        else if (type === 'video') {
            div.classList.add("media-thumbnail-video");
            div.style.backgroundImage = "url(video.png)";
        }
        else if (type === 'audio') {
            div.classList.add("media-thumbnail-audio");
            div.style.backgroundImage = "url(audio.png)";
        }
        else {
            div.classList.add("media-thumbnail-unknown");
            div.style.backgroundImage = "url(unknown.png)";
        }

        div.addEventListener("click", () => {
            navigator.clipboard.writeText(window.location.origin + m).then(() => {
                console.log('URL copied to clipboard', window.location.origin + m);
                document.getElementById("copied").style.display = "block";
                setTimeout(() => {
                    document.getElementById("copied").style.display = "none";
                }, 1000);
            })
        });
        container.appendChild(div);
    });
})