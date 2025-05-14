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
                if (stream) {
                    this.stream = stream;
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            this.chunks.push(e.data);
                        }
                    }

                    mediaRecorder.onstop = () => {
                        const blob = new Blob(this.chunks, { type: 'audio/webm' });
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
        this.chunks = [];
        return new Promise((resolve, reject) => {
            // Generate a unique filename per recording
            const fileName = `recording-${Date.now()}.webm`;
            // Use the appropriate directory for each platform
            const dir = (cordova.file && cordova.file.cacheDirectory) ? cordova.file.cacheDirectory : '';
            const filePath = dir + fileName;
    
            // Create Media object
            const mediaRec = new Media(filePath,
                // Success callback
                () => {
                    // Success on media object creation, not recording
                },
                // Error callback
                (err) => {
                    reject('Media error: ' + JSON.stringify(err));
                }
            );
    
            // Start recording
            mediaRec.startRecord();
    
            // Call the provided callback (for UI updates, etc)
            if (typeof recordCallback === 'function') {
                recordCallback();
            }
    
            // Stop after 5 seconds (to match your web version)
            setTimeout(() => {
                mediaRec.stopRecord();
    
                // Wait a bit to ensure file is written
                setTimeout(() => {
                    // Now read the file as a Blob for upload
                    window.resolveLocalFileSystemURL(filePath, (fileEntry) => {
                        fileEntry.file((file) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                // The result is an ArrayBuffer, wrap it as a Blob
                                this.blob = new Blob([reader.result], { type: 'audio/webm' });
                                resolve(this.blob);
                            };
                            reader.onerror = (e) => reject('File read error: ' + e.target.error);
                            reader.readAsArrayBuffer(file);
                        }, (err) => reject('FileEntry error: ' + JSON.stringify(err)));
                    }, (err) => reject('resolveLocalFileSystemURL error: ' + JSON.stringify(err)));
                }, 300); // Small delay to ensure file is finalized
            }, 5000);
        });
    }
    

    // recordAPP(recordCallback) {
    //     return new Promise(async (resolve, reject) => 
    //     {   
    //         var that = this;

    //         function onAudioInput(evt) {
    //             console.log("Audio data received: " + evt.data.length + " bytes");
    //             that.chunks.push(evt.data);
    //         }

    //         function onAudioInputError(error) {
    //             console.error("An error occurred: " + error);
    //             audioinput.stop();
    //             reject(error);
    //         }

    //         function startRecording() {
    //             console.log("Starting recording...");
    //             recordCallback();

    //             window.removeEventListener( "audioinput", onAudioInput, false );
    //             window.removeEventListener( "audioinputerror", onAudioInputError, false );

    //             window.addEventListener( "audioinput", onAudioInput, false );
    //             window.addEventListener( "audioinputerror", onAudioInputError, false );

    //             that.chunks = [];

    //             audioinput.start({ bufferSize: 8192 });

    //             setTimeout(() => {
    //                 audioinput.stop();
    //                 const blob = new Blob(that.chunks, { type: 'audio/webm' });
    //                 that.blob = blob;
    //                 resolve(that.blob);
    //             }, 5000);
    //         }

            
    //         // First check whether we already have permission to access the microphone.
    //         window.audioinput.checkMicrophonePermission(function(hasPermission) {
    //             if (hasPermission) {
    //                 console.log("We already have permission to record.");
    //                 startRecording();
    //             } 
    //             else {	        
    //                 // Ask the user for permission to access the microphone
    //                 window.audioinput.getMicrophonePermission(function(hasPermission, message) {
    //                     if (hasPermission) {
    //                         console.log("User granted us permission to record.");
    //                         startRecording();
    //                     } else {
    //                         console.warn("User denied permission to record.");
    //                         reject("User denied permission to record.");
    //                     }
    //                 });
    //             }
    //         });

            
    //     })
    // }

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

            form.append("audio", this.blob, `recording-${Date.now()}.webm`);
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