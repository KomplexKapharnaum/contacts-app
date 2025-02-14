function log(msg) {
    console.log(`[\x1b[36mServer\x1b[0m]\t${msg}`);
}

// Starting
//

console.log("                                                                                ")
console.log("░░      ░░░░      ░░░   ░░░  ░░        ░░░      ░░░░      ░░░        ░░░      ░░")
console.log("▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒    ▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒▒▒")
console.log("▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓  ▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓▓▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓      ▓▓")
console.log("█  ████  ██  ████  ██  ██    █████  █████        ██  ████  █████  ███████████  █")
console.log("██      ████      ███  ███   █████  █████  ████  ███      ██████  ██████      ██")
console.log("                                                                                ")
log('Starting...');

// Importing modules
//

import './server-js/core/server.js';
import './server-js/core/env.js';
import db from './server-js/core/database.js';

import './server-js/network/query.js';
import './server-js/network/routes.js';
import './server-js/network/socket.js';
import './server-js/network/github-hook.js';

import SCORE from './server-js/score.js';
import './server-js/trophies.js'
import util from './server-js/utils.js'

import './server-js/mobileapp/updater.js';
import './server-js/mobileapp/notifier.js';

import comfygen from './server-js/comfygen.js';

// Test purposes
// 

async function test() {
    const one_day = 1000 * 60 * 60 * 24;
    const session = await db.createSession("test session", new Date() - one_day, new Date() + one_day);
    // console.log(session[0]);
    
    // db.createEvent = async (session_id, start_date, name, description, location_coords, location_name) => {

    // db.createEvent(session[0], new Date(Date.now() - 1000), "Hautes herbes", "le carnaval émerge...", "45.787805, 4.919129", "Parc municipal Elsa Triolet");
    db.createEvent(session[0], new Date(Date.now() + one_day + 1000 * 30), "Incoming event", "1 minutes from now", "1.3215,2.154", "LOCATION NAME");
    db.createEvent(session[0], new Date(Date.now() + one_day * 2), "test event 2", "test description 2", "0,0", "test location 2");

    for (let i = 0; i < 10; i++) {
        const user = await db('users').insert({
            uuid: util.createUUID(),
            name: "user" + i,
            tribe_id: 3,
            subscribed_session: 0,
            score: Math.floor(Math.random() * 10000)
        });
    }
}

test();


/* === Routines === */

const ONE_HOUR = 1000 * 60 * 60;
setInterval(SCORE.updateLeaderBoard, ONE_HOUR/2);
SCORE.updateLeaderBoard();

comfygen.run();