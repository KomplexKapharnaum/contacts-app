
// Get div for color display
const colordiv = document.getElementById("voco-color");

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);

// Init VOCOLOR
const VOCOLOR = new Vocolor({
    div: document.getElementById("voco-color"),
    color: urlParams.get('color') || "#00F",
    bufferSize: 100, // Size of the volume buffer
    flashThreshold: 80 // Flash when volume is above this threshold
});

// Start button
const startButton = document.getElementById('voco-start');

startButton.addEventListener('click', () => {
    VOCOLOR.start();
    startButton.style.display = 'none';
});