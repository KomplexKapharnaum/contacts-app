const audio = document.getElementById("audio")
const video = document.getElementById("video")

const list = {
    1: { // Machines
        video: "https://media.kxkm.net/8_Infinty_CELL-3-Cellulaire - faible.mp4",
        audio: "https://media.kxkm.net/TRIBU STORY DEMAIN MACHINE.mp3"
    },
    2: { // Animaux OK
        video: "https://media.kxkm.net/6_APP_Yeux_Animaux-Cellulaire - faible.mp4",
        audio: ""
    },
    3: { // Végétaux OK
        video: "https://media.kxkm.net/APP_YEUX_VEGETAUX.mp4",
        audio: ""
    }
}

const play = (id) => {
    audio.src = list[id].audio;
    audio.load();
    audio.play();
    video.src = list[id].video;
    video.load();
    video.play();
}

function getTribe() {
    const urlParams = new URLSearchParams(window.location.search);
    const tribeParam = urlParams.get('tribe') || '1';
    return tribeParam
}

play(getTribe())