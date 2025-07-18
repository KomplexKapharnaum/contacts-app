const plantEmojis = ['🌱','🌿','🍀','🌾','🌵','🌲','🌳','🌴','🌻','🌹','🌷','🌼','🌽','🍄'];

const container = document.getElementById("array")

const synth = new Tone.PolySynth ().toDestination();

function plant(id, id2) {
    this.elm = document.createElement("div");
    this.elm.classList.add("plant");
    this.elm.note = notes[id];
    this.elm.attack = triggerAttacks[id2];

    container.appendChild(this.elm);

    this.update = () => {
        this.elm.innerHTML = plantEmojis[Math.floor(Math.random() * plantEmojis.length)];    
    }

    this.update();

    this.elm.addEventListener("touchenter", () => {
        this.update();
    })
}

const notes = ["C4", "E4", "G4", "A4", "C5", "E5"];
const triggerAttacks = ["8n", "16n", "32n", "64n", "128n", "256n"];

for (let i=0 ; i<6*6 ; i++) {
    new plant(Math.floor(i/6), i%6);
}

let previous = null;
document.addEventListener("touchmove", function(e) {
    var touch = e.touches[0];
    var elm = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elm.classList && elm.classList.contains("plant")) {
        if (previous != elm) {
            synth.triggerAttackRelease(elm.note, elm.attack);
            elm.dispatchEvent(new Event("touchenter"))
        };
        previous = elm;
    }
});