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
        awards: {
            xp: 100
        }
    },

    msg1: {
        name: "Bonjour cyberespace !",
        desc: "J'ai envoyé mon premier message dans le cyberespace",
        awards: {
            xp: 50
        }
    },
    msg10: {
        name: "Membre confirmé",
        desc: "J'ai envoyé 10 messages dans le cyberespace",
        awards: {
            xp: 100
        }
    },
    msg30: {
        name: "Habitué",
        desc: "J'ai envoyé 30 messages dans le cyberespace",
        awards: {
            xp: 200
        }
    },

    stay5: {
        name: "Posé",
        desc: "Je suis resté sur l'application pendant 5 minutes !",
        awards: {
            xp: 50
        }
    },
    stay15: {
        name: "Fais comme chez toi",
        desc: "Je suis resté sur l'application pendant 15 minutes !",
        awards: {
            xp: 50
        }
    },
    stay30: {
        name: "Ma nouvelle maison",
        desc: "Je suis resté sur l'application pendant 30 minutes !",
        awards: {
            xp: 100
        }
    },
    stay60: {
        name: "Accro",
        desc: "Je suis resté sur l'application pendant 60 minutes !",
        awards: {
            xp: 200
        }
    },

    avatar: {
        name: "Digitalisé",
        desc: "Je me suis fais un avatar !",
        awards: {
            xp: 150
        }
    },

    event1: {
        name: "Participant",
        desc: "J'ai participé à 1 évènement !",
        awards: {
            xp: 100
        }
    },
    event2: {
        name: "Adepte",
        desc: "J'ai participé à 2 évènements !",
        awards: {
            xp: 300
        }
    },
    event3: {
        name: "L'intégrale",
        desc: "J'ai participé à tous les évènements !",
        awards: {
            xp: 500
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