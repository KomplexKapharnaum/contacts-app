import { env } from '../core/env.js';
import db from '../core/database.js';
import util from '../utils.js';
import { app } from '../core/server.js';
import { rateLimit } from 'express-rate-limit'
import police from '../core/police.js';
import stats from '../stats.js';
import score from '../score.js';

if (env.BYPASS_RATELIMIT) {
    const ratelimit_general = rateLimit({
        skip: (req) => { 
            const pathname = req._parsedUrl.pathname === '/query'
            const queryname = req.query.queryname === "create_user"
            const uuidCorrect = req.query.uuid && util.userExists(req.query.uuid)
            const isRegieRequest = req.query.queryname && req.query.queryname.startsWith("r_") 
            return (pathname && queryname || uuidCorrect || !pathname || isRegieRequest)},
        windowMs: 60 * 1000, // per ms
        limit: 5, // requests
        message: JSON.stringify([false, "too many requests"])
    })
    app.use(ratelimit_general);

    const ratelimit_create_user = rateLimit({
        skip: (req) => { return !(req._parsedUrl.pathname === '/query' && req.query.queryname === "create_user") },
        windowMs: 60 * 5000, // 5 minutes
        limit: 1, // 1 request
        skipFailedRequests: true,
        message: JSON.stringify([false, "too many requests"])
    })
    app.use(ratelimit_create_user);
}

var query = {list:{}};

query.add = (queryname, callback) => {
    query.list[queryname] = callback;
}

query.request = async (req, params) => {
    const queryname = params.get("queryname");
    if (!queryname) return false;
    if (!query.list[queryname]) return false;

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

query.add("create_user", async (params) => {
    const uuid = util.createUUID();
    const public_id = util.createPublicID();
    const name = params.get("name");
    const tribe_id = parseInt(params.get("tribe_id"));

    const valid = util.isUserNameValid(name)
    if (!valid[0]) return valid;

    let obj = {uuid, name, public_id, tribe_id}
    const userID = await db('users').insert(obj);
    obj.id = userID;
    stats.loadUser(obj);

    return [true, obj];
})

query.add("get_user", async (params) => {
    var user = await db('users').where('uuid', params.get("uuid")).first();
    if (!user) return [false, "user does not exist"];

    delete user.id;
    user.avatars = JSON.parse(user.avatars);

    stats.loadUser(user);

    return [true, user];
})

query.add("update_username", async (params) => {
    const uuid = params.get("uuid");
    const name = params.get("name");

    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    if (!util.isUserNameValid(name)[0]) return [false, "username not valid"];

    await db('users').where('uuid', uuid).update({name: name});

    return [true, {uuid: uuid, name: name}];
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

    const session = await db('session').where('id', subscribed_session.subscribed_session).first();
    if (!session) return [false, "session does not exist"];
    const events = await db('event').where('session_id', session.id).andWhere('ended', false).select();
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
    console.log(tribeID);
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
    const tribes = await db('tribes').select();
    return [true, tribes];
})

query.add("leaderboard", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];

    const tribeID = params.get("tribe_id");
    let data = await score.getLeaderBoard()

    for (let [key, value] of Object.entries(data)) {
        if (key != tribeID) delete data[key].players;
    }

    return [true, data];
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

    const tribes = await db('tribes').select();
    return [true, tribes];
})

query.add("r_new_preset", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const name = params.get("name");
    const group = params.get("group");
    const data = params.get("data");
    await db('presets').insert({name: name, group: group, data: data});
    return [true, {name: name, group: group, data: data}];
})

query.add("r_get_presets", async (params) => {
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];
    const presets = await db('presets').select();
    return [true, presets];
})

query.add("admin", async (params) => {
    const uuid = params.get("uuid");
    if (await util.userExists(uuid) == false) return [false, "user does not exist"];
    if (params.get("pass") != env.ADMIN_PASS) return [false, "wrong password"];

    await db('users').where('uuid', uuid).update({admin: true});
    return [true, {uuid: uuid, message: "User set to admin"}];
})

export { query };