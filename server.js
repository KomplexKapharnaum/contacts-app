import './server-js/core/server.js';
import './server-js/core/env.js';
import db from './server-js/core/database.js';

import './server-js/network/query.js';
import './server-js/network/routes.js';
import './server-js/network/socket.js';
import SCORE from './server-js/score.js';
import './server-js/trophies.js'

// Test purposes
// 

async function test() {
    const one_day = 1000 * 60 * 60 * 24;
    const session = await db.createSession("test session", new Date() - one_day, new Date() + one_day);
    // console.log(session[0]);
    
    // db.createEvent = async (session_id, start_date, name, description, location_coords, location_name) => {

    // db.createEvent(session[0], new Date(Date.now() - 1000), "Hautes herbes", "le carnaval émerge...", "45.787805, 4.919129", "Parc municipal Elsa Triolet");
    db.createEvent(session[0], new Date(Date.now() + one_day ), "Incoming event", "45 minutes from now", "1.3215,2.154", "LOCATION NAME");
    db.createEvent(session[0], new Date(Date.now() + one_day * 2), "test event 2", "test description 2", "0,0", "test location 2");
}

test();

/* === Routines === */

const ONE_HOUR = 1000 * 60 * 60;
setInterval(SCORE.updateLeaderBoard, ONE_HOUR/2);
SCORE.updateLeaderBoard();