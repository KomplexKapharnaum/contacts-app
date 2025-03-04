const goto_onboarding_username = document.getElementById("goto-onboarding-username")

goto_onboarding_username.addEventListener("click", () => {	
    PAGES.goto("onboarding-username")
})

const onboarding_validate_username = document.getElementById("onboarding-validate-username")
const onboarding_input_username = document.getElementById("onboarding-input-username")
const onboarding_username_error = document.getElementById("onboarding-username-error")

let onboarding_userdata_buffer = {}

onboarding_input_username.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
        onboarding_validate_username.click()
    }
})

onboarding_validate_username.addEventListener("click", () => {
    const username = onboarding_input_username.value
    const valid = isUserNameValid(username)
    if (valid[0]) {
        // onboarding_userdata_buffer.username = username
        onboarding_create_user(username)
        // PAGES.goto("onboarding-questions-fingerprint")
    } else {
        onboarding_username_error.innerText = valid[1]
    }
})

function onboarding_create_user(username) {
    let firebasetoken = CORDOVA_INFO.token ? CORDOVA_INFO.token : false
    QUERY.process("create_user", {name: username, firebase_id: firebasetoken}).then((res) => {
        if (res.status) {
            if (res.data.uuid) {
                userData = res.data
                document.CONFIG.set("uuid", res.data.uuid)
                BUD.setCurrentDialogue(BUD_DIALS.welcome, true)
                subscribeToSession(res.data.uuid)

                if (cordova) {
                    cordova.plugins.firebase.messaging.subscribe("all")
                    .then(function () {
                        console.log("Successfully subscribed to the topic!");
                    })
                    .catch(function (error) {
                        console.error("Error subscribing to the topic:", error);
                    });
                }

            } else {
                onboarding_username_error.innerText = "Une erreur est survenue"
            }
        } else {
            onboarding_username_error.innerText = res.data
        }
    })
}

// const onboarding_tribes_container = document.getElementById("onboarding-tribe-selector")
// const template_onboarding_tribe = document.getElementById("tem-onboarding-tribe")
// const onboarding_tribe_validate = document.getElementById("onboarding-validate-tribe")

// PAGES.addCallback("onboarding-tribe", async () => {
//     onboarding_tribes_container.innerHTML = ""
//     const tribes = await QUERY.getTribes()
//     let containers = []
//     if (tribes.status) {
//         tribes.data.forEach(tribe => {
//             const btn = template_onboarding_tribe.cloneNode(true)
//             .content.querySelector(".tribe-container")
            
//             btn.style.setProperty("--tribe-color", tribe.color)

//             const capitalized =
//             tribe.name.charAt(0).toUpperCase()
//             + tribe.name.slice(1)

//             btn.querySelector("button").innerText = capitalized

//             onboarding_tribes_container.appendChild(btn)
            
//             btn.querySelector("button").addEventListener("click", () => {
//                 containers.forEach(e => e.classList.remove("active"))
//                 onboarding_userdata_buffer.tribeID = tribe.id

//                 btn.classList.add("active")
//                 onboarding_tribe_validate.classList.add("active")
//                 onboarding_tribe_validate.innerText = "Rejoindre la tribu " + tribe.name
//             })
            
//             containers.push(btn)
//         });
//     }
// })

// onboarding_tribe_validate.addEventListener("click", () => {
//     onboarding_create_user(
//         onboarding_userdata_buffer.username, 
//         onboarding_userdata_buffer.tribeID
//     )
// })


/* Onboarding questions */

let obform_data = {};

const obform_life_fingerprint = document.getElementById("btn-onboarding-question-fingerprint")
const obform_life_state = document.querySelector("#onboarding-question-fingerprint-status > div")
const obform_life_result = document.querySelector("#onboarding-question-fingerprint-result")
const obform_life_send = document.getElementById("onboarding-questions-fingerprint-send")

let obform_life_percent = 0

obform_life_fingerprint.addEventListener("touchstart", () => {
    obform_life_percent = 0;
    obform_life_state.style.width = obform_life_percent + "%";

    obform_life_send.classList.remove("disabled")

    const interval = setInterval(() => {
        console.log("obform_life_percent", obform_life_percent)
        obform_life_percent += 1;
        obform_life_percent = Math.min(obform_life_percent, 100);
        obform_life_state.style.width = obform_life_percent + "%";

        if (obform_life_percent >= 100) {
            obform_life_result.innerText = "Vous êtes très vivant !";
        } else if (obform_life_percent >= 50) {
            obform_life_result.innerText = "Vous êtes vivant !";
        } else {
            obform_life_result.innerText = "Vous n'êtes pas très vivant";
        }

        if (obform_life_percent >= 100) {
            clearInterval(interval);
        }
    }, 50);

    const stopProgress = () => {
        clearInterval(interval);
        obform_life_fingerprint.removeEventListener("touchend", stopProgress);
        obform_life_fingerprint.removeEventListener("touchcancel", stopProgress);
    };

    obform_life_fingerprint.addEventListener("touchend", stopProgress);
    obform_life_fingerprint.addEventListener("touchcancel", stopProgress);
})

obform_life_send.addEventListener("click", () => {
    obform_data.fingerprint = obform_life_percent
    PAGES.goto("onboarding-questions-violence")
})

const obform_violence_btn = document.getElementById("btn-onboarding-question-violence-spam")
const obform_violence_send = document.getElementById("onboarding-questions-violence-send")

let obform_violence_state = 0;
let obform_violence_clicks = 0;
let obform_violence_timer;

obform_violence_btn.addEventListener("click", () => {
    if (obform_violence_state === 0) {    
        obform_violence_state = 1;
        obform_violence_clicks = 0;

        clearTimeout(obform_violence_timer);
        obform_violence_timer = setTimeout(() => {
            const clicksPerSecond = obform_violence_clicks / 10;
            obform_violence_btn.innerText = `${clicksPerSecond} clicks par seconde !`;
            obform_violence_state = 2;
            obform_violence_btn.removeEventListener("click", incrementClicks);
            obform_violence_send.classList.remove("disabled")


        }, 10000);

        obform_violence_btn.addEventListener("click", incrementClicks);
    }
});

const incrementClicks = () => {
    if (obform_violence_state === 1) {
        obform_violence_clicks++;
        obform_violence_btn.innerText = obform_violence_clicks
    }
};

obform_violence_send.addEventListener("click", () => {
    obform_data.violence = obform_violence_clicks
    PAGES.goto("onboarding-questions-dish")
})

// obform_violence_btn.addEventListener("touchend", () => {
//     obform_violence_btn.removeEventListener("touchend", incrementClicks);
// });

const obform_dishes_container = document.getElementById("dishes")
// const obform_dishes_send = document.getElementById("onboarding-questions-dish-send")

function obform_adddish(src, value) {
    const img = document.createElement("img")
    img.src = src
    img.alt = value
    img.classList.add("obform-dish")
    obform_dishes_container.appendChild(img)

    img.addEventListener("click", () => {
        obform_data.dish = value
        obform_process()
    })
}

obform_adddish(document.BASEPATH + "/img/load.gif", "animal")
obform_adddish(document.BASEPATH + "/img/load.gif", "vegetable")
obform_adddish(document.BASEPATH + "/img/load.gif", "machine")

async function obform_process() {
    let rank = {
        animal: 0,
        vegetable: 0,
        machine: 0
    }

    // Fingerprint
    if (obform_data.fingerprint >= 100) {
        rank.animal++
    } else if (obform_data.fingerprint >= 50) {
        rank.vegetable++
    } else {
        rank.machine++
    }

    // Violence
    if (obform_data.violence >= 55) {
        rank.animal++
    } else if (obform_data.violence >= 30) {
        rank.machine++
    } else {
        rank.vegetable++
    }

    // Dish
    switch (obform_data.dish) {
        case "animal":
            rank.animal++
            break;
        case "vegetable":
            rank.vegetable++
            break;
        case "machine":
            rank.machine++
            break;
    }

    let highestRank = null
    let highestCount = 0
    for (let r in rank) {
        if (rank[r] > highestCount) {
            highestRank = r
            highestCount = rank[r]
        }
    }

    let chosenTribeID = null
    switch (highestRank) {
        case "machine":
            chosenTribeID = 1
            break;
        case "animal":
            chosenTribeID = 2
            break;
        case "vegetable":
            chosenTribeID = 3
            break;
    }

    if (chosenTribeID) {
        const updateUser = await QUERY.setTribe(chosenTribeID)
        const tribes = await QUERY.getTribes()

        if (!updateUser.status || !tribes.status) {
            alert("Une erreur s'est produite, veuillez recharger la page.");
            return
        };
        
        userData.tribe_id = updateUser.data.tribe_id
        DATA_TRIBES = tribes.data
        document.getElementById("tribe-name").innerText = tribes.data[userData.tribe_id-1].name

        const tribeName = DATA_TRIBES[updateUser.data.tribe_id].name

        if (cordova) {
            cordova.plugins.firebase.messaging.subscribe("tribe-"+tribeName)
            .then(function () {
                console.log("Successfully subscribed to the topic!");
            })
            .catch(function (error) {
                console.error("Error subscribing to the topic:", error);
            });
        }

        feature_show("tribe")
        PAGES.goto("tribe")

        BUD.setCurrentDialogue(BUD_DIALS.tribe, true)
        showNavbar(true)
    }
}