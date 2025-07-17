const kpad_pointer = document.getElementById("kpad-pointer")
const kpad_guide_vertical = document.getElementById("guide-vertical")
const kpad_guide_horizontal = document.getElementById("guide-horizontal")

let kppDat = {
    r: 0,
    xpct: 0.5,
    ypct: 0.5,
    lrp: 0,
    lrpTar: 0,
    lerp: (a, b, t) => (1-t)*a + t*b
}
let lastTime = performance.now()
const updateKpadPointer = () => {
    const time = performance.now()
    const elapsed = time - lastTime
    lastTime = time

    kppDat.lrp = kppDat.lerp(kppDat.lrp, kppDat.lrpTar, elapsed / 150)
    kppDat.r += elapsed * kppDat.xpct * 2 * kppDat.lrp
    kpad_pointer.style.transform = `translate(-50%, -50%) scale(${0.1 + kppDat.ypct*0.9}) rotate(${kppDat.r}deg)`

    kpad_guide_vertical.style.left = `${kppDat.xpct*100}%`
    kpad_guide_horizontal.style.top = `${100-kppDat.ypct*100}%`

    requestAnimationFrame(updateKpadPointer)
}
updateKpadPointer()

// TOUCHPAD KAOSCILLATOR PAD

let touchpad = document.getElementById('touchpad');
let controls = document.getElementById('controls');
let statusDiv = document.getElementById('status');

const synthList = ["sine", "square", "sawtooth", "triangle"]

// SYNTH
const synth = new Tone.Synth();
synth.oscillator.type = synthList[Math.floor(Math.random()*synthList.length)];

// OUT->DISTO
const distortion = new Tone.Distortion(1).toDestination();
synth.connect(distortion);

// IN->LFO for vibrato
const lfo = new Tone.LFO({type: "sawtooth"}).start();
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

const constrain = (value, min, max) => Math.min(Math.max(value, min), max);

// Coords PCT from touchpad x,y
function eventToCoords(event) {
    let x = event.touches[0].clientX - touchpad.offsetLeft;
    let y = event.touches[0].clientY - touchpad.offsetTop;

    const bounds = touchpad.getBoundingClientRect()

    const pointerX = constrain(
        event.touches[0].clientX - bounds.left,
        0, 
        bounds.width
    )

    const pointerY = constrain(
        event.touches[0].clientY - bounds.top,
        0, 
        bounds.height  
    )

    kpad_pointer.style.left = `${pointerX}px`
    kpad_pointer.style.top = `${pointerY}px`

    let xPCT = pointerX / bounds.width; // Percentage of X position
    let yPCT = 1.0 - pointerY / bounds.height; // Percentage of Y position
    
    // Clamp values to [0, 1]
    xPCT = Math.max(0, Math.min(1, xPCT));
    yPCT = Math.max(0, Math.min(1, yPCT));

    // kpad_pointer.style.transform = `translate(-50%, -50%) scale(${0.1 + yPCT*0.9}) rotate(${performance.now() * xPCT}deg)`;

    kppDat.xpct = xPCT
    kppDat.ypct = yPCT

    return [xPCT, yPCT];
}

// Touch START
//
touchpad.addEventListener('touchstart', function(event) {
    kppDat.lrpTar = 1
    event.preventDefault(); // Prevent default touch behavior

    // Touchpad first touch event : initialize Tone.js
    //
    if (Tone.context.state !== 'running') {
        // Initialize Tone.js
        Tone.start().then(() => {
            console.log('Tone.js is ready');
            statusDiv.textContent = 'Prêt !';
        }).catch(error => {
            console.error('Error initializing Tone.js:', error);
            statusDiv.textContent = 'Status: Error initializing';
        });
    }

    // Touchpad background opacity
    // touchpad.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Change to a semi-transparent color
    touchpad.classList.add("active")

    // Get the touch position
    let coords = eventToCoords(event);
    statusDiv.textContent = `${Math.round(coords[0])}, ${Math.round(coords[1])}`;

    // Play the synth sound
    playSynth(coords);
});

// Touch MOVE
//
touchpad.addEventListener('touchmove', function(event) {
    event.preventDefault(); // Prevent default touch behavior

    // Update the status
    let coords = eventToCoords(event);
    statusDiv.textContent = `${Math.round(coords[0] * 100)}, ${Math.round(coords[1] * 100)}`;

    // Update the synth sound
    updateSynth(coords);
});

// Touch END
//
touchpad.addEventListener('touchend', function(event) {
    kppDat.lrpTar = 0
    event.preventDefault(); // Prevent default touch behavior

    // Reset the touchpad background color
    // touchpad.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Change back to a more transparent color
    touchpad.classList.remove("active")

    console.log('Touch ended');

    // Update the status
    statusDiv.textContent = 'Déplacez le curseur';

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
statusDiv.textContent = 'Déplacez le curseur';