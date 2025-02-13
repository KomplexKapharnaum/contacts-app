import { __dirname } from '../../path.js';
import knex from 'knex';
import fs from 'fs';
import {env} from './env.js';
import { table } from 'console';

const dataPath = __dirname + '/data.db';

const db = knex({
    client: 'sqlite3',
    connection: { filename: dataPath, },
    useNullAsDefault: true
})

// RESET DB
//
if (fs.existsSync(dataPath) && env.DESTROY_DB_ON_START) {
    fs.unlinkSync(dataPath);
}


// Database schema
//

async function initDB() {

    await db.schema

        .createTable('avatars', (table) => {
            table.increments('id');
            table.integer('user_id').unsigned().references('users.id');
            table.string('status').default('pending');
            table.string('filename');
        })

        .createTable('tribes', (table) => {
            table.increments('id');
            table.string('name');
            table.json('color').default('[]');
            table.integer('score').default(0);
        })

        .createTable('session', (table) => {
            table.increments('id');
            table.string('name');
            table.boolean('frozen').default(false);
            table.string('date_start');
            table.string('date_end');
        })

        .createTable('event', (table) => {
            table.increments('id');
            table.integer('session_id').unsigned().references('session.id');
            table.string('start_date');
            table.boolean('ended').default(false);
            table.string('name');
            table.string('description');
            table.json('location_coords').default('{lat: 0, lon: 0}');
            table.string('location_name');
        })

        .createTable('users', (table) => {
            table.increments('id');
            table.string('uuid'); // User token, other users should NEVER see it
            table.string('public_id'); // Use this instead
            table.string('name');
            table.json('avatars').default('[]');
            table.integer('selected_avatar').unsigned().references('avatars.id');
            table.integer('tribe_id').unsigned().references('tribes.id');
            table.integer('subscribed_session').unsigned().references('session.id');
            table.string('firebase_id');
            table.boolean('admin').default(false);
            table.json('stats').default('{}');
            table.json('trophies').default('[]');
            table.integer('score').default(0);
        })

        .createTable('messages', (table) => {
            table.increments('id');
            table.boolean("admin").default(false);
            table.string('name');
            table.dateTime("date");
            table.string("uuid");
            table.string("public_id");
            table.string("message");
            table.json("reports").default('[]');
            table.boolean("deleted").default(false);
            table.integer("tribeID").default(0);
        })

        .createTable('presets', (table) => {
            table.increments('id');
            table.string("group");
            table.string("name");
            table.json("data");
        })

        .createTable('notifications', (table) => {
            table.increments('id');
            table.string("message");
            table.string("color").default("cyberspace");
            table.integer("tribeID").default(0);
        })

        .createTable('feedback', (table) => {
            table.increments("id");
            table.string("username");
            table.string("message");
            table.string("date");
            table.integer("status").default(0);
        })

        db.createTribe("techno", "#FFFF00");
        db.createTribe("animal", "#FF0000");
        db.createTribe("vegetal", "#00FF00");
}

// Send feedback

db.sendFeedBack = async (username, message) => {
    const feedback = await db('feedback').insert({username, message, date: new Date().toISOString(), status: 0});
    return feedback;
}

// Tribe related
//

db.createTribe = async (name, color) => {
    const tribe = await db('tribes').insert({name: name, color: color});
    return tribe;
}

// Message related
//

db.createMessage = async (admin, name, date, uuid, public_id, message, tribeID) => {
    const msg = await db('messages').insert({admin, name, uuid, public_id, message, date, tribeID});
    return msg;
}

db.createNotification = async(message, color, tribeID=0) => {
    const msg = await db('notifications').insert({message, tribeID, color});
    return msg;
}

// Session related
//

db.createSession = async (name, date_start, date_end) => {
    date_start = new Date(date_start).toISOString();
    date_end = new Date(date_end).toISOString();
    const session = await db('session').insert({name, date_start, date_end});
    return session;
}

db.freezeSession = async (id) => {
    const session = await db('session').where('id', id).update({frozen: true});
    return session;
}

// Event related
// 

db.createEvent = async (session_id, start_date, name, description, location_coords, location_name) => {
    const event = await db('event').insert({
        session_id: session_id, 
        start_date: new Date(start_date).toISOString(), 
        name: name, 
        description: description, 
        location_coords: location_coords, 
        location_name: location_name
    });
    return event;
}

db.endEvent = async (id) => {
    const event = await db('event').where('id', id).update({ended: true});
    return event;
}

// INIT DB
//
if (!fs.existsSync(dataPath)) {
    initDB()
}

export default db