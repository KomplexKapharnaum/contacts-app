const INTRO = {}

INTRO.textbox = document.getElementById("intro-textbox");

INTRO.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));	

INTRO.showtext = async (text) => {
    INTRO.textbox.innerHTML = ""
    return new Promise(async (resolve, reject) => {
        for (let i = 0; i < text.length; i++) {
            INTRO.textbox.innerText += text[i]; 
            await INTRO.sleep(text[i]=="." ? 500 : 30);
        }    
        resolve()
    })
}

INTRO.answerbox = document.querySelector(".answers")
INTRO.answer1 = document.getElementById("intro-answer-1")
INTRO.answer2 = document.getElementById("intro-answer-2")

INTRO.showAnswers = (bool, text1="", text2="") => {
    INTRO.answerbox.classList.toggle("show", bool)
    INTRO.answer1.innerHTML = text1
    INTRO.answer2.innerHTML = text2
}

INTRO.waitForPress = async () => {
    return new Promise(async (resolve, reject) => {
        document.addEventListener("click", function clickHandler(event) {
            resolve()
            document.removeEventListener("click", clickHandler)
        }, { once: true })
    })
}

INTRO.question = async(text, answer1, answer2) => {
    return new Promise(async (resolve, reject) => {
        await INTRO.showtext(text)
        INTRO.showAnswers(true, answer1, answer2)
        INTRO.answer1.addEventListener("click", () => {INTRO.showAnswers(false); resolve(0)})
        INTRO.answer2.addEventListener("click", () => {INTRO.showAnswers(false); resolve(1)})
    })
}

async function intro_start() {
    PAGES.goto("intro")
    showNavbar(false)
    await INTRO.showtext("Nous vivons la fin de l’antropocène et l’humain doit renoncer à sa position dominante. Pour s’adapter à cette mutation, il doit s’hybrider avec d’autres formes du vivant et créer des nouvelles tribus.\nAppuyez pour continuer")
    await INTRO.waitForPress()
    const q1 = await INTRO.question("Choisis le degré de mutation pour laquelle tu te sens prêt·e", "Totale", "Partielle")
    const q2 = await INTRO.question("Choisis le caractère de la tribu que tu souhaites intégrer", "forte et solitaire", "douce et ouverte")
    const q3 = await INTRO.question("Choisis le chemin que tu veux emprunter pour ta mutation", "rapide et ardu", "lent et serein")
    PAGES.goto("onboarding-questions-dish")
}