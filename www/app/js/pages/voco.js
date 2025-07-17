const VOCO = {}

// let RUNNING = false;
// let mic = null, meter = null, currentEffect = null;
// let volumeBuffer = [], intervalId = null;
// const BUFFER_SIZE = 100;
// const FLASH_THRESHOLD = 80;
// let flashOn = false;

VOCO.RUNNING = false;
VOCO.mic = null;
VOCO.meter = null;
VOCO.currentEffect = null;
VOCO.volumeBuffer = [];
VOCO.intervalId = null;
VOCO.BUFFER_SIZE = 100;
VOCO.FLASH_THRESHOLD = 80;
VOCO.flashOn = false;

// COLOR
//

VOCO.colordiv = document.getElementById("voco-color");

VOCO.setColor = function(color) {
    VOCO.colordiv.style.backgroundColor = color;
}

// FX
//

VOCO.effects = [
        () => new Tone.BitCrusher({ bits: Math.floor(Math.random() * 6) + 2, oversample: "2x" }),
        () => new Tone.PitchShift({ pitch: (Math.random() - 0.5) * 12, windowSize: 0.1 }),
        () => new Tone.Distortion({ distortion: Math.random() * 0.8 + 0.2, oversample: "2x" })
    ];

//--- Setup mic/effect chain (INPUT: source node) ---
//--- Start monitoring + normalization ---
VOCO.setupAudioChain = (sourceNode) => {
    VOCO.meter = new Tone.Meter();
    VOCO.currentEffect = VOCO.effects[Math.floor(Math.random() * VOCO.effects.length)](); // Pick a random effect
    
    // Connect mic/source node to meter and effect → output
    sourceNode.connect(VOCO.meter);
    sourceNode.connect(VOCO.currentEffect);
    VOCO.currentEffect.toDestination();
    console.log("Applied effect:", VOCO.currentEffect.name || VOCO.currentEffect.constructor.name);
    
    // Start volume monitoring
    VOCO.volumeBuffer = [];
    if (VOCO.intervalId) clearInterval(VOCO.intervalId);
    VOCO.intervalId = setInterval(() => {
        let vol = VOCO.meter.getValue();
        if (!isFinite(vol)) vol = -100;
        VOCO.volumeBuffer.push(vol);
        if (VOCO.volumeBuffer.length > VOCO.BUFFER_SIZE) VOCO.volumeBuffer.shift();
        let minVol = Math.min(...VOCO.volumeBuffer);
        let maxVol = Math.max(...VOCO.volumeBuffer);
        let norm = (maxVol !== minVol) ? (vol - minVol) / (maxVol - minVol) : 0;
        let scaled = Math.max(0, Math.min(1, norm)) * 100;
        if (scaled < 40) scaled = 0;
        show(Math.round(scaled), vol, minVol, maxVol);
    }, 50);
}

//--- Visual feedback & flashlight trigger ---
VOCO.show = (value) => {

    // Set color opacity
    VOCO.colordiv.style.opacity = value / 100;

    // Flashlight logic (Cordova plugin) ---
    if (!window.plugins || !window.plugins.flashlight) return;
    if (value >= VOCO.FLASH_THRESHOLD && !VOCO.flashOn) {
        window.plugins.flashlight.switchOn(() => { VOCO.flashOn = true; }, () => {});
    } else if (value < VOCO.FLASH_THRESHOLD && VOCO.flashOn) {
        window.plugins.flashlight.switchOff(() => { VOCO.flashOn = false; }, () => {});
    }
}

//--- Main unified mic start flow ---
VOCO.start = async () => {
    if (VOCO.RUNNING) return;
    VOCO.RUNNING = true;

    // Hide button
    const startButton = document.getElementById('start');
    if (startButton) startButton.style.display = 'none';

    try {
        // Cordova + audioinput
        if (typeof window.cordova !== 'undefined' && typeof window.audioinput !== 'undefined') {

            function startCordovaMic() {
                window.audioinput.start({ streamToWebAudio: true });
                // Short delay for node creation in some WebViews
                setTimeout(() => {
                    const audioNode = window.audioinput.audioNode;
                    if (!audioNode) {
                        VOCO.RUNNING = false;
                        alert('Cordova audioinput audioNode not found.');
                        return;
                    }
                    VOCO.setupAudioChain(audioNode);
                    console.log("Cordova mic started successfully");
                }, 350);
            }

            // Permission flow
            window.audioinput.checkMicrophonePermission(function(hasPermission) {
                if (!hasPermission) {
                    window.audioinput.getMicrophonePermission(function(granted) {
                        if (granted) startCordovaMic();
                        else {
                            VOCO.RUNNING = false;
                            alert("Autorisation du microphone requise.");
                        }
                    });
                } else startCordovaMic();
            });

        } else {
            // Web browser logic
            VOCO.mic = new Tone.UserMedia();
            await Tone.start();
            await VOCO.mic.open();
            setupAudioChain(VOCO.mic);
            console.log("Web mic started successfully");
        }
    } catch (err) {
        VOCO.RUNNING = false;
        alert("Could not start microphone: " + err.message);
    }
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