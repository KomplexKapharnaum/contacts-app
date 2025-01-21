import db from "./core/database.js";

let STATS = {};

STATS.config = [
    "avatard_voted",
    "messages_sent",
    "daily_app_open",
    "events_participated",
    "time_spent"
]

STATS.cache = {}

STATS.loadUser = (user) => {
    if (!STATS.cache[user.id]) {
        STATS.cache[user.id] = {
            updated: false,
            data: JSON.parse(user.stats || "{}")
        }
        for (let i of STATS.config) {
            if (!STATS.cache[user.id].data[i]) {
                STATS.cache[user.id].data[i] = 0
                STATS.cache[user.id].updated = true
            }
        }   
    }
}

STATS.update = (userID, key, amount) => {
    STATS.cache[userID].data[key] += amount
}

STATS.save = (userID) => {
    if (!STATS.cache[userID]) return
    if (!STATS.cache[userID].updated) return
    db('users').where('id', userID).update({stats: JSON.stringify(STATS.cache[userID])})
}

export default STATS