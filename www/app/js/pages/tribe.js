const rank_phrases = [
    "Continuez pour ne pas perdre votre prestigieux rang !",
    "Ne lachez rien, vous y êtes presque !",
    "Rien n'est terminé, continuez de vous combattre !"
]

const tribe_leaderboard = document.getElementById("tribe-leaderboard")
const tribe_top10 = document.getElementById("users-podium-top10")

async function loadLeaderBoard() {
    if (!userData) return
    const tribeID = userData.tribe_id

    const data = await QUERY.getLeaderBoard(tribeID)
    if (!data) return
    if (!data.status) return
    
    const header = tribe_leaderboard.querySelector("#tribe-rank")
    const header_suffix = tribe_leaderboard.querySelector("#tribe-rank-suffix")
    const score = tribe_leaderboard.querySelector("#tribe-score")
    const info = tribe_leaderboard.querySelector("#rank-phrase")

    const tribe_rank = Object.values(data.data).sort((a, b) => b.score - a.score).findIndex(obj => obj.id === tribeID) + 1

    header.innerText = tribe_rank + 1
    header_suffix.innerText = tribe_rank>0 ? "eme" : "ère"
    score.innerText = data.data[tribeID].global
    info.innerText = rank_phrases[tribe_rank]

    const leaderboard_players = data.data[tribeID].players

    for (let i=0;  i<10 ; i++) {
        const ply = leaderboard_players[i]
        if (ply) {
            if (i<3) {
                const elm = document.querySelector("#users-podium-top3 [data-rank='"+(i+1)+"']")
                elm.querySelector(".score").innerText = `(${ply.score})`
                elm.querySelector(".username").innerText = ply.name
            } else {
                const tem = document.getElementById("tem-leaderboard-top10").cloneNode(true).content
                tem.querySelector(".rank").innerText = i+1
                tem.querySelector(".username").innerText = ply.name
                tribe_top10.appendChild(tem)
            }
        }
    }
}