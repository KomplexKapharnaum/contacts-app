class Vocolor {
    constructor(options) {
        let { div, color, bufferSize = 100, flashThreshold = 80 } = options;
        if (!div) throw new Error("Vocolor requires a valid div element.");

        this.RUNNING = false;
        this.mic = null;
        this.meter = null;
        this.intervalId = null;
        this.volumeBuffer = [];
        this.BUFFER_SIZE = bufferSize;
        this.FLASH_THRESHOLD = flashThreshold;
        this.flashOn = false;
        this.colordiv = div;

        if (typeof color !== 'string' || !/^#[0-9A-F]{3,6}$/i.test(color)) {
            color = "#00F";
        }

        this.setColor(color);

        // Audio FX chain for web (Tone.js)
        this.effects = [
            () => new Tone.BitCrusher({ bits: Math.floor(Math.random() * 6) + 2, oversample: "2x" }),
            () => new Tone.PitchShift({ pitch: (Math.random() - 0.5) * 12, windowSize: 0.1 }),
            () => new Tone.Distortion({ distortion: Math.random() * 0.8 + 0.2, oversample: "2x" })
        ];
        this.currentEffect = null;

        // FX for Cordova visual display
        this.fxList = ['none', 'bitcrush', 'distortion', 'randominvert', 'pulse'];
        this.currentFx = this.fxList[0];
    }

    setColor(color) {
        if (this.colordiv) this.colordiv.style.backgroundColor = color;
    }

    setOpacity(opacity) {
        if (this.colordiv) this.colordiv.style.opacity = opacity;
    }

    nextFx() {
        let idx = this.fxList.indexOf(this.currentFx);
        this.currentFx = this.fxList[(idx + 1) % this.fxList.length];
    }

    async start() {
        if (this.RUNNING) return;
        this.RUNNING = true;

        if (userData.tribe_id) this.setColor(customTribeColors[userData.tribe_id])

        if (typeof window.cordova !== 'undefined' && typeof window.audioinput !== 'undefined') {
            // Cordova: PCM-based metering, visual FX only
            const startCordova = () => {
                window.removeEventListener('audioinput', this._onAudioInput, false);
                this._onAudioInput = this._cordovaMicHandler.bind(this);
                this.volumeBuffer = [];
                this._fxPhase = 0;

                window.addEventListener('audioinput', this._onAudioInput, false);
                window.audioinput.start({
                    streamToWebAudio: false,
                    sampleRate: 16000,
                    bufferSize: 2048,
                    channels: 1,
                    format: 'PCM_16BIT'
                });
                console.log('Cordova audioinput started');
            };

            window.audioinput.checkMicrophonePermission(has => {
                if (!has) {
                    window.audioinput.getMicrophonePermission(granted => {
                        if (granted) startCordova();
                        else {
                            this.RUNNING = false;
                            alert("Microphone permission required.");
                        }
                    });
                } else startCordova();
            });
        } else {
            // --- Web version: Tone.js + full effect chain ---
            this.mic = new Tone.UserMedia();
            await Tone.start();
            await this.mic.open();
            this.setupAudioChain(this.mic);
            console.log("Web mic (Tone.js) started successfully");
        }
    }

    // --- Cordova handler: Float32 PCM chunk in [-1,1], for visual animation only ---
    _cordovaMicHandler(evt) {
        if (!this.RUNNING) return;
        let pcm = evt.data;
        if (!pcm) return;
        if (!(pcm instanceof Float32Array)) pcm = new Float32Array(pcm);

        // Compute average absolute value for loudness
        let absSum = 0;
        for (let i = 0; i < pcm.length; i++) absSum += Math.abs(pcm[i]);
        let avg = absSum / pcm.length;

        // Optional: log for tuning
        // console.log('Cordova mic avg:', avg);

        // Visual FX logic
        let fxLevel = avg;
        // switch(this.currentFx) {
        //     case 'bitcrush':
        //         fxLevel = Math.floor(avg * 16) / 16;
        //         break;
        //     case 'distortion':
        //         fxLevel = Math.min(1, Math.abs(avg * 2));
        //         break;
        //     case 'randominvert':
        //         if (Math.random() < 0.2) fxLevel = 1 - avg;
        //         break;
        //     case 'pulse':
        //         fxLevel = avg * (0.6 + 0.4 * Math.sin(Date.now()/120));
        //         break;
        //     default:
        //         // 'none'
        //         break;
        // }

        // Normalization for opacity
        this.volumeBuffer.push(fxLevel);
        if (this.volumeBuffer.length > this.BUFFER_SIZE) this.volumeBuffer.shift();
        let minVol = Math.min(...this.volumeBuffer);
        let maxVol = Math.max(...this.volumeBuffer);
        let norm = (maxVol !== minVol) ? (fxLevel - minVol) / (maxVol - minVol) : 0;
        let scaled = Math.max(0, Math.min(1, norm)) * 100;
        if (scaled < 5) scaled = 0;

        this.setOpacity(scaled / 100);

        // Flashlight logic (Cordova plugin)
        if (window.plugins && window.plugins.flashlight) {
            if (scaled >= this.FLASH_THRESHOLD && !this.flashOn) {
                window.plugins.flashlight.switchOn(() => { this.flashOn = true; }, () => {});
            } else if (scaled < this.FLASH_THRESHOLD && this.flashOn) {
                window.plugins.flashlight.switchOff(() => { this.flashOn = false; }, () => {});
            }
        }
    }

    // --- Web: Setup Tone.js FX Audio Chain and Mic Metering ---
    setupAudioChain(sourceNode) {
        this.meter = new Tone.Meter();
        this.currentEffect = this.effects[Math.floor(Math.random() * this.effects.length)]();

        sourceNode.connect(this.meter);
        sourceNode.connect(this.currentEffect);
        this.currentEffect.toDestination();
        console.log("Applied effect:", this.currentEffect.name || this.currentEffect.constructor.name);

        // Reset volume buffer/history
        this.volumeBuffer = [];
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            let vol = this.meter.getValue(); // dB in average; lower = quieter
            if (!isFinite(vol)) vol = -100;
            // Normalize dB [-100..0] into 0..1 for visuals
            let linearVol = Math.pow(10, vol / 20); // 0.001 to 1
            this.volumeBuffer.push(linearVol);
            if (this.volumeBuffer.length > this.BUFFER_SIZE) this.volumeBuffer.shift();
            let minVol = Math.min(...this.volumeBuffer);
            let maxVol = Math.max(...this.volumeBuffer);
            let norm = (maxVol !== minVol) ? (linearVol - minVol) / (maxVol - minVol) : 0;
            let scaled = Math.max(0, Math.min(1, norm)) * 100;
            if (scaled < 5) scaled = 0;

            this.setOpacity(scaled / 100);
        }, 50);
    }

    stop() {
        if (!this.RUNNING) return;
        this.RUNNING = false;

        if (typeof window.cordova !== 'undefined' && typeof window.audioinput !== 'undefined') {
            window.audioinput.stop();
            window.removeEventListener('audioinput', this._onAudioInput, false);
            this.volumeBuffer = [];
        } else {
            if (this.mic) this.mic.close();
            if (this.intervalId) clearInterval(this.intervalId);
            this.volumeBuffer = [];
        }
        this.setOpacity(1);

        if (window.plugins && window.plugins.flashlight && this.flashOn) {
            window.plugins.flashlight.switchOff(() => { this.flashOn = false; }, () => {});
        }
    }
}
