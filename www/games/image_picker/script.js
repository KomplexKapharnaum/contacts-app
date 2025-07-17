const mediaList = document.getElementById("media-list")
const overlay = document.getElementById("overlay")
const back = document.getElementById("return")

function showOverlay(bool, src) {
    overlay.classList.toggle("show", bool);
    overlay.style.setProperty('--bg-url', `url(${src})`);
    back.classList.toggle("show", bool);
}

async function loadImages() {
    return new Promise((resolve, reject) => {
        fetch("https://media.kxkm.net/?json")
            .then(res => res.json())
            .then(data => {
                resolve(data.reduce((acc, image) => {
                    if (image.type == "image") {
                        acc.push(image);
                    }
                    return acc;
                }, [])) 
            })
            .catch(err => reject(err));
    });
}

loadImages().then(images => {
    // console.log(images);
    images.forEach(image => {
        const img = new Image()
        img.src = "https://media.kxkm.net/"+image.path;
        mediaList.appendChild(img);
        img.addEventListener("click", () => {
            showOverlay(true, img.src);
        })
    });
})
.catch(err => console.error(err));

back.addEventListener("click", () => {
    showOverlay(false);
})