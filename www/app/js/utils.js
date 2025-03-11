function formatDate(date) {
    let d = new Date(date),
        day = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()]
        hour = d.getHours(),
        min = d.getMinutes()

    if (min < 10) min = '0' + min
    if (hour < 10) hour = '0' + hour

    return `${day} à ${hour}:${min}`
}

function parseCountDown(date, formatted=true) {
    const now = new Date().getTime()
    const countDownDate = new Date(date).getTime()
    let distance = countDownDate - now

    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    if (formatted) {
        return `${days}j ${hours}h ${minutes}m`
    } else {
        return {
            d: days,
            h: hours,
            m: minutes
        }
    }
}

function isEventLive(date) {
    const now = new Date().getTime()
    const eventDate = new Date(date).getTime()
    return eventDate - now < 0
}

function showNavbar(bool) {
    const navbar = document.querySelector('nav')
    if (bool) {
        navbar.classList.add('show')
    } else {
        navbar.classList.remove('show')
    }
}

function getAvatar() {
    return ''
}

function isUserNameValid(username) {
    if (username.length < 3) return [false, 'Le pseudo doit contenir au moins 3 caractères']
    if (username.length > 20) return [false, 'Le pseudo doit contenir moins de 20 caractères']
    if (username.match(/[^a-zA-Z0-9_-]/)) return [false, 'Le pseudo ne doit contenir que des lettres, des chiffres, des tirets et des underscores']

    return [true, '']
}

function forceupdate() {
    console.log("forceupdate")
    window.localStorage.setItem("APPHASH", "forceupdate");
    location.reload()
}

if (!document.CONFIG) {
    console.log("CONFIG: will use browser cookies")

    document.CONFIG = {
        get: function(name) {
            const nameEQ = name + "="
            const ca = document.cookie.split(';')
            for(let i=0;i < ca.length;i++) {
                let c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null
        },
        set: function(name,value,days=3650) {
            const date = new Date()
            date.setTime(date.getTime()+(days*24*60*60*1000))
            expires = "; expires="+date.toGMTString()
            document.cookie = name+"="+value+expires+"; path=/"
            console.log("CONFIG: set", name, value)
        },
        remove: function(name) {
            document.cookie = name+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            console.log("CONFIG: removed", name)
        }
    }
}
// else console.log("CONFIG: already set up by launcher (Using Cloud settings)")

// MOBILE KEYBOARD DETECTION
// if (document.APPSTATE) {

//     function estimateKeyboardHeight() {
//         let screenHeight = window.screen.height;
//         if (cordova.platformId === 'ios') {
//             if (screenHeight <= 480) return 216;       // iPhone 4S and older
//             if (screenHeight <= 568) return 216;       // iPhone 5, 5S, 5C, SE (1st gen)
//             if (screenHeight <= 667) return 216;       // iPhone 6, 6S, 7, 8, SE (2nd gen)
//             if (screenHeight <= 736) return 226;       // iPhone 6+, 6S+, 7+, 8+
//             if (screenHeight <= 812) return 291;       // iPhone X, XS, 11 Pro
//             if (screenHeight <= 896) return 301;       // iPhone XR, XS Max, 11, 11 Pro Max
//             return 301;                                // Default for newer/larger devices
//         } else {
//             if (screenHeight <= 480) return 200;       // Small Android devices
//             if (screenHeight <= 800) return 230;       // Medium-sized Android devices
//             if (screenHeight <= 1280) return 260;      // Large Android devices
//             return 280;        
//         }
//     }

//     const keyboardShowEvent = new CustomEvent('keyboardDidShow', {detail: {keyboardHeight: estimateKeyboardHeight()}});
//     const keyboardHideEvent = new Event('keyboardDidHide');

//     const keyboardTriggeringInputTypes = [
//         'text', 'password', 'email', 'number', 'tel', 'url', 'search'
//       ];
      
//       let keyboardTimeout;
      
//       document.addEventListener('focusin', function(event) {
//         if (isKeyboardTriggeringInput(event.target)) {
//           clearTimeout(keyboardTimeout);
//           window.dispatchEvent(keyboardShowEvent);
//         }
//       });
      
//       document.addEventListener('focusout', function(event) {
//         if (isKeyboardTriggeringInput(event.target)) {
//           keyboardTimeout = setTimeout(() => {
//           window.dispatchEvent(keyboardHideEvent);
//           }, 100); // Short delay to account for focus switching between inputs
//         }
//       });
      
//       function isKeyboardTriggeringInput(element) {
//         return (
//           (element.tagName === 'INPUT' && keyboardTriggeringInputTypes.includes(element.type)) ||
//           element.tagName === 'TEXTAREA' || (element.contentEditable && element.contentEditable !== 'false')
//         );
//       }
      
//       // Keyboard height detection Exemple
//       //
      
//     window.addEventListener('keyboardDidShow', (event) => {
//         document.documentElement.style.setProperty('--offset', `${-event.detail.keyboardHeight}px`)
//     })

//     window.addEventListener('keyboardDidHide', () => {
//         document.documentElement.style.setProperty('--offset', `0px`)
//     })
// }

// Function to download an image to device storage
function downloadImage(imageUrl, fileName) {
    try {
        navigator.share({
            title: "KXKM Avatar",
            text: "Partagez votre avatar",
            url: imageUrl
        }).then((packageNames) => {
            if (packageNames.length > 0) {
                console.log("Shared successfully with activity", packageNames[0]);
            } else {
                console.log("Share was aborted");
            }
        }).catch((err) => {
            console.error("Share failed:", err.message);
        });
    }
    catch (e) {
        console.error("Share failed:", e);
        alert("Fonctionnalité non disponible pour l'instant.")
    }

    // // Check if we're running on a device (not in browser)
    // if (!window.cordova) {
    //     console.error("This function needs to be run on a device with Cordova");
    //     return;
    // }

    // // Get the appropriate directory for saving files
    // window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dirEntry) {
    //     // Create the file in the directory
    //     dirEntry.getFile(fileName, { create: true, exclusive: false }, function(fileEntry) {
            
    //         // Get a download link
    //         var fileTransfer = new FileTransfer();
            
    //         // Download the file
    //         fileTransfer.download(
    //             imageUrl,
    //             fileEntry.toURL(),
    //             function(entry) {
    //                 // Success callback
    //                 console.log("Download complete: " + entry.toURL());
    //                 alert("Image downloaded successfully!");
    //             },
    //             function(error) {
    //                 // Error callback
    //                 console.error("download error source " + error.source);
    //                 console.error("download error target " + error.target);
    //                 console.error("download error code " + error.code);
    //                 alert("Download failed: " + error.code);
    //             },
    //             false,  // trustAllHosts, set to false for security
    //             {
    //                 headers: {
    //                     // Optional: Add headers if needed for authorization, etc.
    //                 }
    //             }
    //         );
    //     }, function(error) {
    //         console.error("Error creating file: " + error.code);
    //         alert("Error creating file: " + error.code);
    //     });
    // }, function(error) {
    //     console.error("Error accessing filesystem: " + error.code);
    //     alert("Error accessing filesystem: " + error.code);
    // });
}