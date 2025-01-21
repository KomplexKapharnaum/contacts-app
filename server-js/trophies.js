import { app } from './core/server.js';
import SCORE from './score.js';
import { SOCKET } from './network/socket.js';

let TROPHIES = {};

TROPHIES.config = {
    join: {
        name: "Un nouveau monde",
        desc: "J'ai rejoint le réseau CONTACTS",
        img: "car",
        awards: {
            xp: 100
        }
    },
    msg1: {
        name: "Bonjour cyber-espace !",
        desc: "J'ai envoyé mon premier message dans le cyber-espace",
        img: "car",
        awards: {
            xp: 100
        }
    },
    msg20: {
        name: "Membre confirmé",
        desc: "J'ai envoyé 20 messages dans le cyber-espace",
        img: "car",
        awards: {
            xp: 500
        }
    },
    stay10: {
        name: "Posé",
        desc: "Je suis resté sur l'application pendant 10 minutes !",
        img: "car",
        awards: {
            xp: 300
        }
    }
}

TROPHIES.cache = {}

TROPHIES.addPlayer = (user) => {
    if (!TROPHIES.cache[user.id]) {
        TROPHIES.cache[user.id] = {
            updated: false,
            data: JSON.parse(user.trophies || "[]")
        }
    }
}

TROPHIES.reward = (userID, trophyID) => {
    
    if (!TROPHIES.config[trophyID]) return
    if (!TROPHIES.cache[userID]) return
    if (TROPHIES.cache[userID].data.includes(trophyID)) return

    TROPHIES.cache[userID].data.push(trophyID)
    
    const trophy = TROPHIES.config[trophyID]
    for (let [key, value] of Object.entries(trophy.awards)) {
        switch (key) {
            case "xp":
            SCORE.addToPlayer(userID, value);
            break;
        }
    }
    
    SOCKET.toClient(userID, "trophy_reward", trophyID);
    
    TROPHIES.cache[userID].updated = true
}

TROPHIES.save = (userID) => {
    if (!TROPHIES.cache[userID]) return
    if (!TROPHIES.cache[userID].updated) return
    db('users').where('id', userID).update({trophies: JSON.stringify(TROPHIES.cache[userID])})
}

app.get('/trophies', (req, res) => res.json(TROPHIES.config));