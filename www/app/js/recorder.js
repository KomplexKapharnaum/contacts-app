class Recorder {
    constructor() {
        this.stream = false;
        this.chunks = [];
        this.blob = false;
    }

    getStream() {
        return new Promise((resolve, reject) => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log("getUserMedia supported.");
            
                navigator.mediaDevices.getUserMedia({audio: true})
                .then((stream) => {
                    resolve(stream);
                })
                .catch((err) => {console.error(`The following getUserMedia error occurred: ${err}`); resolve(false)});
            } else {
                console.log("getUserMedia not supported on your browser!");
                resolve(false)
            }
        })
    }

    record(recordCallback) {
        this.chunks = [];
        return new Promise(async (resolve, reject) => {
            this.stream = await this.getStream();
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