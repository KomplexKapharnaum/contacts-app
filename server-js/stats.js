import db from "./core/database.js";
import features from "./features.js"

let STATS = {};

STATS.config = [
    "avatars_voted",
    "messages_sent",
    "daily_app_open",
    "events_participated",
    "time_spent",
    "avatar_score",
    
    "avatars_voted_today",
    "last_time_voted"
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

STATS.setToUser = (userID, key, amount) => {
    if (!features.getState("profile_stats")) return;
    STATS.cache[userID].data[key] = amount
    return STATS.cache[userID].data[key]
}

STATS.addToUser = (userID, key, amount) => {
    if (!features.getState("profile_stats")) return;
    STATS.cache[userID].data[key] += amount
    return STATS.cache[userID].data[key]
}

STATS.get = (userID, key) => {
    return STATS.cache[userID].data[key]
}

STATS.save = async (userID) => {
    if (!STATS.cache[userID]) return
    if (!STATS.cache[userID].updated) return
    await db('users').where('id', userID).update({stats: JSON.stringify(STATS.cache[userID].data)})
}
STATS.canVote = (userID) => {
    if (!features.getState("profile_stats")) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const lastTimeVoted = new Date(STATS.cache[userID].data["last_time_voted"]).setHours(0, 0, 0, 0);
    return lastTimeVoted < today;
}

STATS.updateLastTimeVoted = (userID) => {
    if (!features.getState("profile_stats")) return;
    STATS.cache[userID].data["last_time_voted"] = new Date().setHours(0,0,0,0);
}

export default STATS