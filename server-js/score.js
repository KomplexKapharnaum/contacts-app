import database from './core/database.js';
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
    
    const tribeID = player.tribe_id;
    const tribe = await database('tribes').where('id', tribeID).first();
    if (!tribe) return false;
    const newTribeScore = tribe.score + amount;
    await database('tribes').where('id', tribeID).update({score: newTribeScore});
    return true;
}

SCORE.leaderBoard = {};
SCORE.lastUpdated = 0;

SCORE.getLeaderBoard = async () => {
    return SCORE.leaderBoard;
}

SCORE.updateLeaderBoard = async () => {
    const tribes = await database('tribes').select();
    for (let i = 0; i < tribes.length; i++) {

        const t = tribes[i]
        SCORE.leaderBoard[t.id] = {
            global: t.score,
            players: []
        }

        const players = await database('users').where('tribe_id', t.id).select();
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
SCORE.interval = setInterval(()=>SCORE.updateLeaderBoard(), HALF_HOUR);
SCORE.updateLeaderBoard();

export default SCORE