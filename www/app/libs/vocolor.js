class Vocolor {
    /**
     * @param {HTMLElement} div           - The target color div element
     * @param {string} color              - Initial background color (CSS color string)
     * @param {number} [bufferSize=100]   - Buffer size for the volume smoothing
     * @param {number} [flashThreshold=80]- Threshold for triggering flashlight
     */
    constructor(options) {
        let { div, color, bufferSize = 100, flashThreshold = 80 } = options;
        if (!div) {
            console.error("Vocolor requires a valid div element.");
            return;
        }
        
        this.RUNNING = false;
        this.mic = null;
        this.meter = null;
        this.currentEffect = null;
        this.volumeBuffer = [];
        this.intervalId = null;
        this.BUFFER_SIZE = bufferSize;
        this.FLASH_THRESHOLD = flashThreshold;
        this.flashOn = false;
        this.colordiv = div || null;
        
        // Set initial color if provided
        if (typeof color !== 'string' || !/^#[0-9A-F]{6}$/i.test(color)) {
            console.warn("Invalid color format. Using default #00F.");
            color = "#00F"; // Default color
        }
        this.setColor(color);

        // Define available effects
        this.effects = [
            () => new Tone.BitCrusher({ bits: Math.floor(Math.random() * 6) + 2, oversample: "2x" }),
            () => new Tone.PitchShift({ pitch: (Math.random() - 0.5) * 12, windowSize: 0.1 }),
            () => new Tone.Distortion({ distortion: Math.random() * 0.8 + 0.2, oversample: "2x" })
        ];
    }

    setColor(color) {
        if (!this.colordiv) return;
        this.colordiv.style.backgroundColor = color;
    }

    setOpacity(opacity) {
        if (!this.colordiv) return;
        this.colordiv.style.opacity = opacity;
    }

    setupAudioChain(sourceNode) {
        this.meter = new Tone.Meter();
        this.currentEffect = this.effects[Math.floor(Math.random() * this.effects.length)]();

        sourceNode.connect(this.meter);
        sourceNode.connect(this.currentEffect);
        this.currentEffect.toDestination();
        console.log("Applied effect:", this.currentEffect.name || this.currentEffect.constructor.name);

        this.volumeBuffer = [];
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            let vol = this.meter.getValue();
            if (!isFinite(vol)) vol = -100;
            this.volumeBuffer.push(vol);
            if (this.volumeBuffer.length > this.BUFFER_SIZE) this.volumeBuffer.shift();

            let minVol = Math.min(...this.volumeBuffer);
            let maxVol = Math.max(...this.volumeBuffer);
            let norm = (maxVol !== minVol) ? (vol - minVol) / (maxVol - minVol) : 0;
            let scaled = Math.max(0, Math.min(1, norm)) * 100;
            if (scaled < 40) scaled = 0;

            this.setOpacity(scaled / 100);

            // Flashlight logic (Cordova plugin)
            if (!window.plugins || !window.plugins.flashlight) return;

            if (scaled >= this.FLASH_THRESHOLD && !this.flashOn) {
                window.plugins.flashlight.switchOn(() => { this.flashOn = true; }, () => {});
            } else if (scaled < this.FLASH_THRESHOLD && this.flashOn) {
                window.plugins.flashlight.switchOff(() => { this.flashOn = false; }, () => {});
            }
        }, 50);
    }

    async start() {
        if (this.RUNNING) return;
        this.RUNNING = true;

        try {
            // Cordova + audioinput
            if (typeof window.cordova !== 'undefined' && typeof window.audioinput !== 'undefined') {

                const startCordovaMic = () => {
                    window.audioinput.start({ streamToWebAudio: true });
                    setTimeout(() => {
                        const audioNode = window.audioinput.audioNode;
                        if (!audioNode) {
                            this.RUNNING = false;
                            alert('Cordova audioinput audioNode not found.');
                            return;
                        }
                        this.setupAudioChain(audioNode);
                        console.log("Cordova mic started successfully");
                    }, 350);
                };

                window.audioinput.checkMicrophonePermission((hasPermission) => {
                    if (!hasPermission) {
                        window.audioinput.getMicrophonePermission((granted) => {
                            if (granted) startCordovaMic();
                            else {
                                this.RUNNING = false;
                                alert("Microphone permission required.");
                            }
                        });
                    } else startCordovaMic();
                });

            } else {
                // Web browser
                this.mic = new Tone.UserMedia();
                await Tone.start();
                await this.mic.open();
                this.setupAudioChain(this.mic);
                console.log("Web mic started successfully");
            }
        } catch (err) {
            this.RUNNING = false;
            alert("Could not start microphone: " + err.message);
        }
    }

    stop() {
        if (!this.RUNNING) return;
        this.RUNNING = false;

        if (typeof window.cordova !== 'undefined' && typeof window.audioinput !== 'undefined') {
            window.audioinput.stop();
            console.log("Cordova mic stopped");
        } else {
            if (this.mic) this.mic.close();
            console.log("Web mic stopped");
        }

        if (this.intervalId) clearInterval(this.intervalId);
        this.volumeBuffer = [];
        this.setOpacity(1);

        if (window.plugins && window.plugins.flashlight && this.flashOn) {
            window.plugins.flashlight.switchOff(() => { this.flashOn = false; }, () => {});
        }
    }
}
