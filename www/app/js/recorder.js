class Recorder {
    constructor() {
        this.stream = false;
        this.chunks = [];
        this.blob = false;
    }

    getStreamWEB() {
        return new Promise((resolve, reject) => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log("getUserMedia supported.");
            
                navigator.mediaDevices.getUserMedia({audio: true})
                .then((stream) => {
                    resolve(stream);
                })
                .catch((err) => {
                    reject(`The following getUserMedia error occurred: ${err}`)}
                );
            } else {
                reject("getUserMedia not supported on your browser!")
            }
        })
    }

    recordWEB(recordCallback) {
        this.chunks = [];
        return new Promise(async (resolve, reject) => {
            this.getStreamWEB().then((stream) => {
                if (this.stream) {
                    const mediaRecorder = new MediaRecorder(this.stream);
                    mediaRecorder.start();
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            this.chunks.push(e.data);
                        }
                    }

                    mediaRecorder.onstop = () => {
                        const blob = new Blob(this.chunks);
                        this.blob = blob;
                        resolve(this.blob);
                    }

                    setTimeout(() => {
                        mediaRecorder.stop();
                    }, 5000);

                    recordCallback();
                } else {
                    reject("no stream");
                }
            })
            .catch((err) => reject(err))
        })
    }

    recordAPP(recordCallback) {
        return new Promise(async (resolve, reject) => 
        {   
            var that = this;

            function onAudioInput(data) {
                console.log("Audio data received: " + data.length + " bytes");
                this.chunks.push(data);
            }

            function onAudioInputError(error) {
                console.error("An error occurred: " + error);
                audioinput.stop();
                reject(error);
            }

            function startRecording() {
                console.log("Starting recording...");

                window.removeEventListener( "audioinput", onAudioInput, false );
                window.removeEventListener( "audioinputerror", onAudioInputError, false );

                window.addEventListener( "audioinput", onAudioInput, false );
                window.addEventListener( "audioinputerror", onAudioInputError, false );

                that.chunks = [];

                audioinput.start({ bufferSize: 8192 });

                setTimeout(() => {
                    audioinput.stop();
                    const blob = new Blob(that.chunks);
                    that.blob = blob;
                    resolve(that.blob);
                }, 5000);
            }

            
            // First check whether we already have permission to access the microphone.
            window.audioinput.checkMicrophonePermission(function(hasPermission) {
                if (hasPermission) {
                    console.log("We already have permission to record.");
                    startRecording();
                } 
                else {	        
                    // Ask the user for permission to access the microphone
                    window.audioinput.getMicrophonePermission(function(hasPermission, message) {
                        if (hasPermission) {
                            console.log("User granted us permission to record.");
                            startRecording();
                        } else {
                            console.warn("User denied permission to record.");
                            reject("User denied permission to record.");
                        }
                    });
                }
            });

            recordCallback();
        })
    }

    record(recordCallback) {
        if (document.APPSTATE) {
            return this.recordAPP(recordCallback);
        } else {
            return this.recordWEB(recordCallback);
        }
    }

    upload() {
        return new Promise((resolve, reject) => {
            const form = new FormData();

            const audioFile = new File([this.blob], `recording-${Date.now()}.webm`, {
                contentType: 'audio/webm',
            });

            form.append("audio", audioFile);
            form.append("uuid", userData.uuid);

            fetch(document.WEBAPP_URL + "/tribe_audio_upload", {
                method: "POST",
                body: form
            })
            .then((res) => {
                if (res.ok) {
                    resolve(res.text());
                    console.log("Audio uploaded")
                } else {
                    console.error("Error uploading audio")
                }
            })
            .catch((err) => {
                console.error("Error uploading audio", err)
            })
        })
    }
}

// const recorder = new Recorder();

// const recordbtnStates = ["Appuyez pour enregistrer", "Enregistrement en cours...", ]
// const record_btn = document.getElementById("btn-cry-record")
// const cry_preview = document.getElementById("audio-cry")

// let is_recording = false;
// record_btn.addEventListener("click", async () => {
//     if (!is_recording) {
//         is_recording = true;
//         record_btn.innerHTML = recordbtnStates[1]
//         const data = await recorder.start();
//         if (data) {
//             record_btn.innerHTML = recordbtnStates[0]
//             cry_preview.src = URL.createObjectURL(data);
//             cry_preview.load();
//         }
//         recorder.upload();
//     }
// })