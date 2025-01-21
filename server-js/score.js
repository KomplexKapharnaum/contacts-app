import database from './core/database.js';

let SCORE = {};

SCORE.addToPlayer = async (id, amount) => {
    const player = await database('users').where('id', id).first();
    if (!player) return false;
    const newScore = player.score + amount;
    await database('users').where('id', id).update({score: newScore});
    
    const tribeID = player.tribe_id;
    const tribe = await database('tribes').where('id', tribeID).first();
    if (!tribe) return false;
    const newTribeScore = tribe.score + amount;
    await database('tribes').where('id', tribeID).update({score: newTribeScore});
    return true;
}

SCORE.leaderBoard = {};
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
        SCORE.leaderBoard[t.id].players = players.slice(0, 10).map(player => ({
            id: player.id,
            avatar: player.selected_avatar,
            name: player.name,
            score: player.score
        }));
        
    }
}

export default SCORE