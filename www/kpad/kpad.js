


// TOUCHPAD KAOSCILLATOR PAD

let touchpad = document.getElementById('touchpad');
let controls = document.getElementById('controls');
let statusDiv = document.getElementById('status');



// SYNTH
const synth = new Tone.Synth();

// DISTO
const distortion = new Tone.Distortion(1).toDestination();
synth.connect(distortion);

// LFO for vibrato
const lfo = new Tone.LFO({type: "sawtooth"}).start();

// Connect LFO to synth's detune
lfo.connect(synth.detune);

// Play the synth sound
function playSynth(coords) {
    synth.triggerAttack(440, Tone.now()); // Play a note at 440 Hz
    if (coords) updateSynth(coords);
}

// Stop the synth sound
function stopSynth() {
    synth.triggerRelease(Tone.now()); // Release the note
}

// Update Synth
function updateSynth(coords) {
    setModulation(coords[0]);   // X axis = vibrato depth/rate
    setSynthFreq(coords[1]);    // Y axis = pitch
}

// Synth frequency from Y touch (in %)
function setSynthFreq(pct) {
    // Map the percentage to a frequency range (e.g., 100 Hz to 1000 Hz)
    const minFreq = 100; // Minimum frequency in Hz
    const maxFreq = 1000; // Maximum frequency in Hz
    const frequency = minFreq + (pct * (maxFreq - minFreq));
    synth.frequency.setValueAtTime(frequency, Tone.now());
}

// Set modulation depth and rate based on x percentage
function setModulation(xPct) {
    // const minDepth = 0;
    // const maxDepth = 100;
    // const depth = minDepth + (maxDepth - minDepth) * xPct;
    const depth = 100;

    const minRate = 0;
    const maxRate = 20;
    const rate = minRate + (maxRate - minRate) * xPct;

    lfo.min = -depth;
    lfo.max = depth;
    lfo.frequency.value = rate; // Optional: comment out if you want only depth
}

// Coords PCT from touchpad x,y
function eventToCoords(event) {
    let x = event.touches[0].clientX - touchpad.offsetLeft;
    let y = event.touches[0].clientY - touchpad.offsetTop;
    let xPCT = x / touchpad.clientWidth + 0.5; // Percentage of X position
    let yPCT = 1.0 - y / touchpad.clientHeight; // Percentage of Y position
    // Clamp values to [0, 1]
    xPCT = Math.max(0, Math.min(1, xPCT));
    yPCT = Math.max(0, Math.min(1, yPCT));
    return [xPCT, yPCT];
}


// Touch START
//
touchpad.addEventListener('touchstart', function(event) {
    event.preventDefault(); // Prevent default touch behavior


    // Touchpad first touch event : initialize Tone.js
    //
    if (Tone.context.state !== 'running') {
        // Initialize Tone.js
        Tone.start().then(() => {
            console.log('Tone.js is ready');
            statusDiv.textContent = 'Status: Ready';
        }).catch(error => {
            console.error('Error initializing Tone.js:', error);
            statusDiv.textContent = 'Status: Error initializing';
        });
    }

    // Touchpad background opacity
    touchpad.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Change to a semi-transparent color

    // Get the touch position
    let coords = eventToCoords(event);
    statusDiv.textContent = `Status: Touching at (${coords[0]}, ${coords[1]})`;

    // Play the synth sound
    playSynth(coords);
});

// Touch MOVE
//
touchpad.addEventListener('touchmove', function(event) {
    event.preventDefault(); // Prevent default touch behavior

    // Update the status
    let coords = eventToCoords(event);
    statusDiv.textContent = `Status: Touching at (${Math.round(coords[0] * 100)}, ${Math.round(coords[1] * 100)})`;

    // Update the synth sound
    updateSynth(coords);
});

// Touch END
//
touchpad.addEventListener('touchend', function(event) {
    event.preventDefault(); // Prevent default touch behavior

    // Reset the touchpad background color
    touchpad.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Change back to a more transparent color

    console.log('Touch ended');

    // Update the status
    statusDiv.textContent = 'Status: Touch ended';

    // Stop the synth sound
    stopSynth(event);
});

// Mouse -> Touch
let isMouseDown = false;

touchpad.addEventListener('mousedown', function(event) {
    event.preventDefault(); // Prevent default mouse behavior
    isMouseDown = true;

    // Create a proper touch event
    let touchEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
            identifier: 0,
            target: touchpad,
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
            screenX: event.screenX,
            screenY: event.screenY
        })],
        bubbles: true,
        cancelable: true
    });
    
    touchpad.dispatchEvent(touchEvent);
});

// Mouse -> Touch MOVE
touchpad.addEventListener('mousemove', function(event) {
    if (!isMouseDown) return;
    
    event.preventDefault(); // Prevent default mouse behavior

    // Create a proper touch event
    let touchEvent = new TouchEvent('touchmove', {
        touches: [new Touch({
            identifier: 0,
            target: touchpad,
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
            screenX: event.screenX,
            screenY: event.screenY
        })],
        bubbles: true,
        cancelable: true
    });
    
    touchpad.dispatchEvent(touchEvent);
});

// Mouse -> Touch END
touchpad.addEventListener('mouseup', function(event) {
    if (!isMouseDown) return;
    
    event.preventDefault(); // Prevent default mouse behavior
    isMouseDown = false;

    // Create a proper touch event
    let touchEvent = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [new Touch({
            identifier: 0,
            target: touchpad,
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
            screenX: event.screenX,
            screenY: event.screenY
        })],
        bubbles: true,
        cancelable: true
    });
    
    touchpad.dispatchEvent(touchEvent);
});


// Status: waiting for touch
//
statusDiv.textContent = 'Status: Waiting for touch';