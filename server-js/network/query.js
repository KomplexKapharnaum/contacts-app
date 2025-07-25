import { env } from '../core/env.js';
import db from '../core/database.js';
import db_static from '../core/database_static.js';
import util from '../utils.js';
import { app } from '../core/server.js';
import { rateLimit } from 'express-rate-limit'
import police from '../core/police.js';
import { SOCKET } from './socket.js';

import stats from '../stats.js';
import score from '../score.js';
import trophies from '../trophies.js';
import comfygen from '../comfygen.js';
import features from '../features.js'
import firebase from './firebase.js';

// if (env.BYPASS_RATELIMIT) {
//     const ratelimit_general = rateLimit({
//         skip: (req) => { 
//             const pathname = req._parsedUrl.pathname === '/query'
//             const queryname = req.query.queryname === "create_user"
//             const uuidCorrect = req.query.uuid && util.userExists(req.query.uuid)
//             const isRegieRequest = req.query.queryname && req.query.queryname.startsWith("r_") 
//             return (pathname && queryname || uuidCorrect || !pathname || isRegieRequest)},
//         windowMs: 60 * 1000, // per ms
//         limit: 5, // requests
//         message: JSON.stringify([false, "too many requests"])
//     })
//     app.use(ratelimit_general);

//     const ratelimit_create_user = rateLimit({
//         skip: (req) => { return !(req._parsedUrl.pathname === '/query' && req.query.queryname === "create_user") },
//         windowMs: 60 * 5000, // 5 minutes
//         limit: 1, // 1 request
//         skipFailedRequests: true,
//         message: JSON.stringify([false, "too many requests"])
//     })
//     app.use(ratelimit_create_user);
// }

var query = {list:{}};

query.add = (queryname, callback) => {
    query.list[queryname] = callback;
}

query.request = async (req, params) => {
    const queryname = params.get("queryname");
    if (!queryname) return false;
    if (!query.list[queryname]) return false;

    if (!features.getState("open_app")) return [false, "feature disabled"];

    const res = await query.list[queryname](params);
    
    if (res[0]) {
        if (res[1] && res[1].uuid) {
            police.updateQuery(res[1].uuid, req.socket.remoteAddress);
        }
    }

    return res;
}

// Add requests here
//

query.add("username_valid", async (params) => {
    const name = params.get("name");
    return util.isUserNameValid(name);
})

async function getUserInfo(uuid) {
    var user = await db('users').where('uuid', uuid).first();
    if (!user) return false;

    user.avatars = JSON.parse(user.avatars);
    stats.loadUser(user);
    trophies.loadUser(user);

    user.trophies = JSON.parse(user.trophies);
    user.stats = JSON.parse(user.stats);

    const userAvatarID = user.selected_avatar;
    
    if (userAvatarID) {
        let avatar = await db('avatars').where('id', userAvatarID).first();
        if (avatar) {
            const status = avatar.status;
            user.avatar = status=="done" ? avatar.filename : status;
        }
    }

    return user;
}

query.add("create_user", async (params) => {
    const uuid = util.createUUID();
    const public_id = util.createPublicID();
    const name = params.get("name");
    const firebase_id = params.get("firebase_id");
    // const tribe_id = parseInt(params.get("tribe_id"));

    const valid = util.isUserNameValid(name)
    if (!valid[0]) return valid;

    let obj = {uuid, name, public_id, firebase_id};
    await db('users').insert(obj);

    const user = await getUserInfo(uuid);
    if (!user) return [false, "user does not exist"];
    
    stats.loadUser(user);
    trophies.loadUser(user);

    // comfygen.add(user.id, false);

    return [true, user];
})

query.add("get_user", async (params) => {
    const user = await getUserInfo(params.get("uuid"));
    if (!user) return [false, "user does not exist"];
    return [true, user];
})

query.add("update_username", async (params) => {
    if (!features.getState("profile_page")) return [false, "feature disabled"];

    const uuid = params.get("uuid");
    const name = params.get("name");

    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    if (!util.isUserNameValid(name)[0]) return [false, "username not valid"];

    await db('users').where('uuid', uuid).update({name: name});

    return [true, {uuid: uuid, name: name}];
})

query.add("update_description", async (params) => {
    if (!features.getState("profile_page")) return [false, "feature disabled"];
    if (!features.getState("profile_description")) return [false, "feature disabled"];

    const uuid = params.get("uuid");
    const description = params.get("description");

    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    await db('users').where('uuid', uuid).update({description: description});

    return [true, {uuid: uuid, description: description}];
})

query.add("remove_user", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    await db('users').where('uuid', uuid).del();
    return [true, {uuid: uuid}];
})

query.add("available_session", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const session = await db('session').where('date_end', '>', new Date()).first();
    if (!session) return [false, "no available session"];
    return [true, session.id];
})

query.add("session_subscribe", async (params) => {
    const uuid = params.get("uuid");
    const session_id = params.get("session_id");

    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const session = await db('session').where('id', session_id).first();
    if (!session) return [false, "session does not exist"];

    await db('users').where('uuid', uuid).update({subscribed_session: session_id});
    return [true, {uuid: uuid, session_id: parseInt(session_id)}];
})

query.add("session_info", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const subscribed_session = await db('users').where('uuid', uuid).select('subscribed_session').first();
    if (!subscribed_session) return [false, "user does not have a subscribed session"];

    const session = await db('session').where('id', subscribed_session.subscribed_session).first();
    if (!session) return [false, "session does not exist"];

    return [true, session];
})

query.add("session_events", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    
    const subscribed_session = await db('users').where('uuid', uuid).select('subscribed_session').first();
    if (!subscribed_session) return [false, "user does not have a subscribed session"];

    const user = await db('users').where('uuid', uuid).first();
    if (!user) return [false, "user does not exist"];

    const session = await db('session').where('id', subscribed_session.subscribed_session).first();
    if (!session) return [false, "session does not exist"];

    const events = await db('event')
    .where('session_id', session.id)
    .andWhere('ended', false)
    .andWhere(function() {
      this.where('tribe_id', 0)
      if (user.tribe_id !== null) {
        this.orWhere('tribe_id', user.tribe_id)
      }
    })
    .select();

    events.forEach(event => {
        delete event.location_coords;
        delete event.location_name;
    });
    return [true, events];
})

query.add("event_location", async (params) => {
    const event_id = params.get("event_id");
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    
    const subscribed_session = await db('users').where('uuid', uuid).select('subscribed_session').first();
    if (!subscribed_session) return [false, "user does not have a subscribed session"];

    const session = await db('session').where('id', subscribed_session.subscribed_session).first();
    if (!session) return [false, "session does not exist"];

    const event = await db('event').where('id', event_id).where('session_id', session.id).first();
    if (!event) return [false, "event does not exist"];
    
    const location = {
        event_id: parseInt(event.id),
        name: event.location_name,
        coords: event.location_coords.split(",").map(x => parseFloat(x))
    }

    return [true, location];
})

query.add("get_messages", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const tribeID = params.get("tribe_id");
    const user = await db('users').where('uuid', uuid).first();
    if (user.tribe_id != tribeID && tribeID != 0) return [false, "user not in tribe"];

    const messages = await db('messages')
    .orderBy('date', 'desc')
    .where('admin', false)
    .where('tribeID', tribeID)
    .whereNot('deleted', true)
    .limit(25)
    .select();

    const admin_messages = await db('messages')
    .where('admin', true)
    .where('tribeID', tribeID)
    .whereNot('deleted', true).select();

    const processed = [...messages, ...admin_messages].map(msg => {
        delete msg.uuid;
        return msg;
    })

    return [true, processed];
})

query.add("tribelist", async (params) => {
    // if (!features.getState("page_tribe")) return [false, "feature disabled"];

    const tribes = await db_static('tribes').select();
    return [true, tribes];
})

query.add("set_tribe", async (params) => {
    if (!features.getState("tribe_page")) return [false, "feature disabled"];
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const tribeID = params.get("tribe_id");
    const user = await db('users').where('uuid', uuid).first();

    if (user.tribe_id) return [false, "user already in a tribe"];

    await db('users').where('uuid', uuid).update({ tribe_id: tribeID });
    return [true, {uuid: uuid, tribe_id: tribeID}];
})

query.add("leaderboard", async (params) => {
    if (!features.getState("tribe_page")) return [false, "feature disabled"];

    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    
    let data = await score.getLeaderBoard();

    return [true, data];
})

query.add("notifications", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    const tribeID = params.get("tribe_id");

    console.log("loading notification for", tribeID)

    const notifications = await db('notifications').where('tribeID', 'in', [tribeID, 0])

    return [true, notifications];
})

query.add("send_feedback", async (params) => { 
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const user = await db('users').where('uuid', uuid).first();
    const username = user.name;
    const message = params.get("message");

    const res = await db.sendFeedBack(username, message);
    return [true, res];
})

query.add("random_avatars", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const user = await db('users').where('uuid', uuid).first();

    if (!stats.canVote(user.id)) return [false, "user cannot vote"];

    const tribeID = user.tribe_id;
    const randomUsers = await db('users')
    .where('tribe_id', tribeID)
    .whereNot('id', user.id)
    .whereNot('selected_avatar', null)
    .orderByRaw('RANDOM()')
    .limit(10)
    .select('id', 'selected_avatar')

    stats.setToUser(user.id, "avatars_voted_today", 0);
    stats.updateLastTimeVoted(user.id);

    const processedRandomUsers = await Promise.all(randomUsers.map(async user => {
        const avatar = await db('avatars').where('id', user.selected_avatar).first();
        return {
            userid: user.id,
            avatar_path: avatar.filename
        }
    }))

    return [true, processedRandomUsers];
})

query.add("tribe_mashup", async (params) => {
    const uuid = params.get("uuid");
    const count = params.get("count");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const user = await db('users').where('uuid', uuid).first();

    // if (!user.audio) return [false, "user has no audio"];

    const tribeID = user.tribe_id;
    const randomUsers = await db('users')
    .where('tribe_id', tribeID)
    .whereNot('id', user.id)
    .whereNot('audio', null)
    .orderByRaw('RANDOM()')
    .limit(count?Math.min(25, count):5)
    .select('audio')

    const audioPaths = randomUsers.map(x => x.audio);

    return [true, audioPaths];
})

query.add("update_last_seen", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    await db('users').where('uuid', uuid).update({last_seen: new Date()});
    return [true, {uuid: uuid}];
})

query.add("read_notifications", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    const user = await db('users').where('uuid', uuid).first();
    const last_seen = user.last_seen ? user.last_seen : 0;
    const notifications = await db('notifications').where('created_at', '>', last_seen).select();
    return [true, notifications];
})

query.add("reset_my_tribe", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    await db('users').where('uuid', uuid).update({tribe_id: null});
    return [true, {uuid: uuid}];
})

// Regie query

query.add("r_eventlist", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const current_session = await db('session').where('date_end', '>', new Date()).first();
    if (!current_session) return [false, "no available session"];

    const events = await db('event').where('session_id', current_session.id).select();
    return [true, events];
});

query.add("r_endevent", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];

    const event_id = params.get("event_id");

    const event = await db('event').where('id', event_id).first();
    if (!event) return [false, "event does not exist"];
    
    await db('event').where('id', event_id).update({ended: true});
    return [true, event];
});

query.add("r_tribelist", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];

    const tribes = await db_static('tribes').select();
    return [true, tribes];
})

query.add("r_new_preset", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const name = params.get("name");
    const group = params.get("group");
    const data = params.get("data");
    const exists = await db_static('presets').where('name', name).first();
    if (exists) {
        await db_static('presets').where('name', name).update({group: group, data: data});
    } else {
        await db_static('presets').insert({name: name, group: group, data: data});
    }
    return [true, {name: name, group: group, data: data}];
})

query.add("r_get_presets", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const presets = await db_static('presets').select();
    return [true, presets];
})

query.add("r_delete_preset", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const id = params.get("id");
    const preset = await db_static('presets').where('id', id).first();
    if (!preset) return [false, "preset does not exist"];
    await db_static('presets').where('id', id).delete();
    return [true, {id: id}];
})

query.add("admin_getfeedbacks", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const feedbacks = await db('feedback').select();
    return [true, feedbacks];
})

query.add("admin_updatefeedback", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const id = params.get("id");
    const status = params.get("status");
    await db('feedback').where('id', id).update({status: status});
    return [true, {id: id, status: status}];
});

// query.add("r_updatefeature", async (params) => {
//     if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
//     const name = params.get("name");
//     const status = params.get("status");
//     await features.edit(name, status)
//     return [true, {name: name, status: status}];
// });

query.add("admin", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];

    await db('users').where('uuid', uuid).update({admin: true});
    return [true, {uuid: uuid, message: "User set to admin"}];
})

/* Admin panel queries */

query.add("admin_send_notification", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];

    const text = params.get("text");
    const color = params.get("color");
    const addtochat = params.get("add_to_chat"); 
    const tribe = params.get("tribe") == '' ? null : params.get("tribe");

    await db.createNotification(text, color);

    if (!env.DISABLE_FIREBASE) {
        if (tribe) {
            firebase.toTribe(tribe, addtochat ? "Nouveau message" : "Notification", text);
        } else {
            firebase.broadcastMessage(addtochat ? "Nouveau message" : "Notification", text);
        }
    }
    
    if (addtochat) {
        // SOCKET.io.to("user").emit("chat-message", { text, color, add_to_chat: addtochat, tribe });
        const id = await db.createMessage(true, "Notification", Date.now(), false, false, text, 0);
        const messageData = {
            date: Date.now(),
            admin: true,
            public_id: false,
            id: id[0], 
            tribeID: 0,
            message: text,
            name: "Notification"
        };
        SOCKET.io.to("user").emit("chat-message", messageData);
    }
    
    console.log("Notification sent");
    return [true, "Notification sent"];
})

query.add("admin_create_event", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const start_date = params.get("start_date");
    const location_coords = params.get("location_coords");
    const location_name = params.get("location_name");
    const name = params.get("name");
    const tribe_id = params.get("tribe_id");
    const priority = params.get("priority");

    const current_session = await db('session').first();
    if (!current_session) return [false, "no session exists"];

    const eventData = {
        start_date,
        location_coords,
        location_name,
        name,
        tribe_id,
        session_id: current_session.id,
        priority: priority==='true'
    };

    await db('event').insert(eventData);

    return [true, eventData];
})

query.add("admin_get_features", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const features = await db('features').select();
    return [true, features];
})

query.add("admin_update_feature", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const name = params.get("name");
    const enabled = params.get("enabled");
    await features.edit(name, enabled);
    return [true, {name: name, enabled: enabled}];
})

query.add("admin_get_chat", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const messages = await db('messages').orderBy('date', 'desc').limit(50).select();
    return [true, messages.reverse()];
})

query.add("admin_delete_message", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const id = params.get("id");
    await db('messages').where('id', id).delete();
    SOCKET.io.to("user").emit("delete-message", id);
    return [true, {id: id}];
})

query.add("admin_getall", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];

    const table = params.get("table");
    const data = await db(table).select();
    return [true, data];
})

query.add("admin_update", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    
    const table = params.get("table");
    const data = JSON.parse(params.get("data"));
    const id = params.get("id");

    const res = await db(table).where('id', id).update(data);
    return [true, {id: id, data: data}];
})

query.add("admin_delete", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const table = params.get("table");
    const id = params.get("id");
    await db(table).where('id', id).delete();
    return [true, {id: id}];
})

query.add("admin_download_questions", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const questions = await db('live-answers').select();
    const questionsText = questions.map(q => `${q.question}\n${q.answer}`).join('\n\n');
    return [true, questionsText];
})

// admin_reset_database
query.add("admin_reset_database", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    db.archive();
    return [true, "database reset"];
})

query.add("admin_stats", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const stats = {
        users: await db('users').count('id as i').first(),
        avatars: await db('users').whereNotNull('selected_avatar').count('id as i').first(),
        crys: await db('users').whereNotNull('audio').count('id as i').first(),
        msgs: (await db('messages').select()).reduce((arr, msg) => {
            if (!arr.includes(msg.uuid)) arr.push(msg.uuid)
            return arr;
        }, []).length,
    }
    return [true, stats];
})

export { query };