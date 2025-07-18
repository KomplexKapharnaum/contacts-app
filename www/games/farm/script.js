const sounds = ["meow.ogg", "dog.ogg", "roar.mp3", "monkey.wav", "horse.mp3", "chicken.mp3", "quack.mp3"];
const randomSound = () => sounds[Math.floor(Math.random() * sounds.length)];
const synth = new Tone.PolySynth().toDestination();

let players = {};
let currentPlayer = null;
let isPlaying = false;

// Load all sounds
sounds.forEach(sound => {
    players[sound] = new Tone.Player(`./sounds/${sound}`).toDestination();
    players[sound].loop = true;
});

// Touch event handlers
document.addEventListener('touchstart', async (e) => {
    e.preventDefault();
    
    if (!isPlaying) {
        await Tone.start();
        
        const selectedSound = randomSound();
        currentPlayer = players[selectedSound];
        currentPlayer.start();
        isPlaying = true;
    }
});

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    if (isPlaying && currentPlayer) {
        const touch = e.touches[0];
        const y = touch.clientY;
        const screenHeight = window.innerHeight;
        
        // Map Y position to pitch (higher Y = lower pitch)
        const pitchRatio = 1 - (y / screenHeight);
        const pitch = 0.5 + (pitchRatio * 1.5); // Range from 0.5 to 2.0
        
        currentPlayer.playbackRate = pitch;
    }
});

document.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    if (isPlaying && currentPlayer) {
        currentPlayer.stop();
        currentPlayer = null;
        isPlaying = false;
    }
});

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");
ctx.fillStyle = "#000000";

let points = [];
const maxPoints = 64;

const map = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function draw() {
    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    ctx.lineWidth = 8;
    if (points.length > maxPoints) {
        points.shift();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const r = () => Math.random() * 4 - 2
    for (let i = 0; i < points.length - 1; i++) {
        const mid_y = (points[i].y + points[i + 1].y) / 2;
        const col = map(mid_y, 0, canvas.height, 0, 1);
        ctx.strokeStyle = `rgb(${col * 255}, 0, 0)`;
        ctx.lineWidth = 4 + col * 32;
        ctx.beginPath();
        ctx.moveTo(points[i].x + r(), points[i].y + r());
        ctx.lineTo(points[i + 1].x + r(), points[i + 1].y + r());
        ctx.stroke();
    }
}

document.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    points.push({ x, y });
    draw();
});

document.addEventListener("touchend", () => {
    points=[];
    draw();
});