const VOCOLOR = new Vocolor({
    div: document.getElementById("voco-color"),
    color: "#00F",
    bufferSize: 100, // Size of the volume buffer
    flashThreshold: 80 // Flash when volume is above this threshold
});

document.getElementById('voco-stop').addEventListener('click', () => {
    VOCOLOR.stop();
})

PAGES.addCallback("game-vocolor", ()=>{
    VOCOLOR.start();
});