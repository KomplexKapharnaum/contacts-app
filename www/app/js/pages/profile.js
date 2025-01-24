
document.getElementById("profile-delete").addEventListener("click", () => {
    showNavbar(false)
    app_confirm("Voulez-vous supprimer votre compte ?").then((res) => {
        if (res) {
            PAGES.goto("loading")
            QUERY.process("remove_user", {uuid: userData.uuid}).then(() => {
                userData = {}
                document.CONFIG.remove("uuid")
                hasEventsLoaded = false
                loadUser()
            })
        } else {
            PAGES.goto("profile")
            showNavbar(true)
        }
    })
})

document.getElementById("profile-edit-username").addEventListener("click", () => {
    showNavbar(false)
    app_prompt("Quel est votre nouveau pseudo ?").then((res) => {
        if (res) {
            PAGES.goto("loading")
            QUERY.updateName(res).then(() => {
                PAGES.goto("profile")
                showNavbar(true)
            })
        } else {
            PAGES.goto("profile")
            showNavbar(true)
        }
    })
})


const tem_trophy = document.getElementById("tem-trophy")
const trophies_container = document.getElementById("trophies")
function updateTrophies() {
    trophies_container.innerHTML = ""
    fetch(document.WEBAPP_URL+"/trophies")
        .then(res => res.json())
        .then(data => {
            for (let [id, info] of Object.entries(data)) {
                const clone = tem_trophy.cloneNode(true).content
                const trophy = clone.querySelector(".trophy")
                
                trophy.style.backgroundImage = `url(${document.BASEPATH}/img/trophies/${info.img}.png)`
                clone.querySelector(".info").innerHTML = `${info.name} : ${info.desc}`

                trophy.addEventListener("click", () => {
                    trophies_container.querySelectorAll(".trophy").forEach(t => t.classList.remove("active"))
                    trophy.classList.add("active")
                })

                trophies_container.appendChild(clone)
            }
            document.addEventListener("click", (ev) => {
                if (ev.target.classList.contains("trophy")) return
                trophies_container.querySelectorAll(".trophy").forEach(t => t.classList.remove("active"))
            })
        })
}