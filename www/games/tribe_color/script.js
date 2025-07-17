let RUNNING = false;
let mic = null, meter = null, currentEffect = null;
let volumeBuffer = [], intervalId = null;
const BUFFER_SIZE = 100;
const FLASH_THRESHOLD = 80;
let flashOn = false;

//--- Color/Opacity helpers ---
function getColor() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('color') || 'blue';
}
function setColor(color) {
    document.body.style.setProperty('--color', color);
}
function setOpacity(opacity) {
    document.body.style.setProperty('--opacity', opacity);
}
setColor(getColor());

//--- Randomized fun Tone.js effect ---
function createRandomEffect() {
    const effects = [
        () => new Tone.BitCrusher({ bits: Math.floor(Math.random() * 6) + 2, oversample: "2x" }),
        () => new Tone.PitchShift({ pitch: (Math.random() - 0.5) * 12, windowSize: 0.1 }),
        () => new Tone.Distortion({ distortion: Math.random() * 0.8 + 0.2, oversample: "2x" })
    ];
    return effects[Math.floor(Math.random() * effects.length)]();
}

//--- Setup mic/effect chain (INPUT: source node) ---
function setupAudioChain(sourceNode) {
    meter = new Tone.Meter();
    currentEffect = createRandomEffect();
    // Connect mic/source node to meter and effect → output
    sourceNode.connect(meter);
    sourceNode.connect(currentEffect);
    currentEffect.toDestination();
    console.log("Applied effect:", currentEffect.name || currentEffect.constructor.name);
}

//--- Start monitoring + normalization ---
function startVolumeMonitor() {
    volumeBuffer = [];
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        let vol = meter.getValue();
        if (!isFinite(vol)) vol = -100;
        volumeBuffer.push(vol);
        if (volumeBuffer.length > BUFFER_SIZE) volumeBuffer.shift();
        let minVol = Math.min(...volumeBuffer);
        let maxVol = Math.max(...volumeBuffer);
        let norm = (maxVol !== minVol) ? (vol - minVol) / (maxVol - minVol) : 0;
        let scaled = Math.max(0, Math.min(1, norm)) * 100;
        if (scaled < 40) scaled = 0;
        show(Math.round(scaled), vol, minVol, maxVol);
    }, 50);
}

//--- Flashlight logic (Cordova plugin) ---
function flashlightControl(normalizedVol) {
    if (!window.plugins || !window.plugins.flashlight) return;
    if (normalizedVol >= FLASH_THRESHOLD && !flashOn) {
        window.plugins.flashlight.switchOn(() => { flashOn = true; }, () => {});
    } else if (normalizedVol < FLASH_THRESHOLD && flashOn) {
        window.plugins.flashlight.switchOff(() => { flashOn = false; }, () => {});
    }
}

//--- Visual feedback & flashlight trigger ---
function show(value, vol, minVol, maxVol) {
    setOpacity(value / 100);
    // For debugging (disable for prod)
    // console.log(`Value: ${value}, Volume: ${vol.toFixed(2)}, Min: ${minVol.toFixed(2)}, Max: ${maxVol.toFixed(2)}`);
    flashlightControl(value);
}

//--- Main unified mic start flow ---
async function startAppMicFlow() {
    if (RUNNING) return;
    RUNNING = true;
    document.body.classList.add('running');
    // Hide button
    const startButton = document.getElementById('start');
    if (startButton) startButton.style.display = 'none';

    try {
        // Cordova + audioinput
        if (typeof window.cordova !== 'undefined' && typeof window.audioinput !== 'undefined') {
            // Permission flow
            window.audioinput.checkMicrophonePermission(function(hasPermission) {
                if (!hasPermission) {
                    window.audioinput.getMicrophonePermission(function(granted) {
                        if (granted) {
                            startCordovaMic();
                        } else {
                            RUNNING = false;
                            document.body.classList.remove('running');
                            alert("Mic permission required.");
                        }
                    });
                } else {
                    startCordovaMic();
                }
            });
        } else {
            // Web browser logic
            await startWebMic();
        }
    } catch (err) {
        RUNNING = false;
        document.body.classList.remove('running');
        alert("Could not start microphone: " + err.message);
    }
}

//--- Cordova setup ---
function startCordovaMic() {
    window.audioinput.start({ streamToWebAudio: true });
    // Short delay for node creation in some WebViews
    setTimeout(() => {
        const audioNode = window.audioinput.audioNode;
        if (!audioNode) {
            RUNNING = false;
            document.body.classList.remove('running');
            alert('Cordova audioinput audioNode not found.');
            return;
        }
        setupAudioChain(audioNode);
        startVolumeMonitor();
        console.log("Cordova mic started successfully");
    }, 350);
}

//--- Web setup ---
async function startWebMic() {
    mic = new Tone.UserMedia();
    await Tone.start();
    await mic.open();
    setupAudioChain(mic);
    startVolumeMonitor();
    console.log("Web mic started successfully");
}

//--- Assign to start button/click (supports both web and Cordova) ---
const startButton = document.getElementById('start');
if (startButton) {
    startButton.addEventListener('click', startAppMicFlow);
} else {
    // Fallback: click anywhere (if needed)
    document.body.addEventListener('click', startAppMicFlow, { once: true });
}

//--- Cordova deviceready gating (optional: triggers only if needed, or could be omitted in favor of user gesture)
if (typeof window.cordova !== 'undefined') {
    document.addEventListener('deviceready', function() {
        // nothing; everything is started on user gesture
    }, false);
}
