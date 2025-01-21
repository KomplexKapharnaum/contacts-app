const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const filter_turb = document.querySelector("#svg-turb")

setInterval(() => {
    filter_turb.querySelector("feTurbulence").setAttribute("seed", Math.floor(Math.random() * 1000))
}, 100)

/*
const buttons = document.querySelectorAll("button:not(nav button)")

buttons.forEach((button) => {
    const x = randomInt(0, 100)
    const y = randomInt(0, 100)

    button.style.setProperty("background-position-x", `${x}%`)
    button.style.setProperty("background-position-y", `${y}%`)
})
*/

const chromatic_red = document.getElementById("chromatic-red")
const chromatic_blue = document.getElementById("chromatic-blue")

function setAberration(value) {
    chromatic_red.setAttribute("dx", value)
    chromatic_red.setAttribute("dy", value)

    chromatic_blue.setAttribute("dx", -value)
    chromatic_blue.setAttribute("dy", -value)
}
setAberration(1)

/*
const filter_noise_turulence = document.getElementById("filter-noise-turbulence")

function updateNoise() {
    const r = randomInt(0, 1000)
    filter_noise_turulence.setAttribute("seed", r)
    requestAnimationFrame(updateNoise)
}
updateNoise()
*/

const noise_overlay = document.getElementById("noise-overlay")

function updateNoise() {
    const rx = Math.floor(Math.random() * 1000)
    const ry = Math.floor(Math.random() * 1000)
    noise_overlay.style.backgroundPosition = `${rx}px ${ry}px`
    requestAnimationFrame(updateNoise)
}
updateNoise()