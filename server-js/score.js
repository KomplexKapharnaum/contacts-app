import database from './core/database.js';
import db_static from './core/database_static.js';
import features from './features.js'
import { SOCKET } from './network/socket.js';

let SCORE = {};

SCORE.addToPlayer = async (id, amount) => {
    if (!features.getState("profile_stats")) return;
    const player = await database('users').where('id', id).first();
    if (!player) return false;
    const newScore = player.score + amount;
    await database('users').where('id', id).update({score: newScore});
    SOCKET.toClient(id, "send-xp", amount);
    
    // const tribeID = player.tribe_id;
    // const tribe = await db_static('tribes').where('id', tribeID).first();
    // if (!tribe) return false;
    // const newTribeScore = tribe.score + amount;
    // await db_static('tribes').where('id', tribeID).update({score: newTribeScore});
    return true;
}

SCORE.leaderBoard = {};
SCORE.lastUpdated = 0;

SCORE.getLeaderBoard = async () => {
    return SCORE.leaderBoard;
}

SCORE.updateLeaderBoard = async () => {
    const tribes = await db_static('tribes').select();
    for (let i = 0; i < tribes.length; i++) {

        const t = tribes[i]

        const players = await database('users').where('tribe_id', t.id).select();
        const totalScore = players.reduce((a, b) => a + b.score, 0);

        SCORE.leaderBoard[t.id] = {
            global: totalScore,
            players: []
        }

        players.sort((a, b) => b.score - a.score);
        const playersWithAvatar = await Promise.all(players.slice(0, 10).map(async player => {
            const avatar = await database('avatars').where('id', player.selected_avatar).first();
            return {
                id: player.id,
                avatar: avatar ? avatar.filename : null,
                name: player.name,
                score: player.score
            }
        }));
        SCORE.leaderBoard[t.id].players = playersWithAvatar;
    }
}

const HALF_HOUR = 1000 * 60 * 30;
const FIVE_MINUTES = 1000 * 60 * 5;
SCORE.interval = setInterval(()=>SCORE.updateLeaderBoard(), FIVE_MINUTES);
SCORE.updateLeaderBoard();

export default SCORE