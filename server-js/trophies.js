import { app } from './core/server.js';
import SCORE from './score.js';
import { SOCKET } from './network/socket.js';
import db from './core/database.js';
import features from './features.js';

let TROPHIES = {};

TROPHIES.config = {
    join: {
        name: "Un nouveau monde",
        desc: "J'ai rejoint le réseau CONTACTS",
        img: "welcome",
        awards: {
            xp: 100
        }
    },
    msg1: {
        name: "Bonjour cyberespace !",
        desc: "J'ai envoyé mon premier message dans le cyberespace",
        img: "msg1",
        awards: {
            xp: 100
        }
    },
    msg20: {
        name: "Membre confirmé",
        desc: "J'ai envoyé 20 messages dans le cyberespace",
        img: "msg20",
        awards: {
            xp: 500
        }
    },
    stay10: {
        name: "Posé",
        desc: "Je suis resté sur l'application pendant 10 minutes !",
        img: "stay10",
        awards: {
            xp: 300
        }
    }
}

TROPHIES.cache = {}

TROPHIES.loadUser = (user) => {
    if (!TROPHIES.cache[user.id]) {
        TROPHIES.cache[user.id] = {
            updated: false,
            data: JSON.parse(user.trophies || "[]")
        }
    }
}

TROPHIES.count = (userID) => {
    if (!TROPHIES.cache[userID]) return 0
    return TROPHIES.cache[userID].data.length
}

TROPHIES.reward = (userID, trophyID) => {
    if (!features.getState("profile_stats")) return;
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

TROPHIES.save = async (userID) => {
    if (!TROPHIES.cache[userID]) return
    if (!TROPHIES.cache[userID].updated) return
    await db('users').where('id', userID).update({trophies: JSON.stringify(TROPHIES.cache[userID].data)})
    delete TROPHIES.cache[userID]
}

app.get('/trophies', (req, res) => res.json(TROPHIES.config));

export default TROPHIES