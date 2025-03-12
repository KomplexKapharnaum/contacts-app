import { __dirname } from '../../path.js';
import knex from 'knex';
import fs from 'fs';
import {env} from './env.js';
import { table } from 'console';
import path from 'path';

const dataPath = path.join(__dirname, 'database', env.DBFILE);

// create folder if not exists
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}

function log(msg) {
    console.log(`[\x1b[35mDatabase\x1b[0m]\t${msg}`);
}


const db = knex({
    client: 'sqlite3',
    connection: { filename: dataPath, },
    useNullAsDefault: true
})

// RESET DB
//
if (env.DESTROY_DB_ON_START && fs.existsSync(dataPath)) {
    fs.unlinkSync(dataPath);
    log('Database destroyed');
}


// Database schema
//

async function initDB() {

    await db.schema

        .createTable('avatars', (table) => {
            table.increments('id');
            table.integer('user_id').unsigned().references('users.id');
            table.string('status').defaultTo('pending');
            table.string('filename');
        })

        .createTable('tribes', (table) => {
            table.increments('id');
            table.string('name');
            table.json('colors').defaultTo('[]');
            // table.integer('score').defaultTo(0);
        })

        .createTable('session', (table) => {
            table.increments('id');
            table.string('name');
            table.boolean('frozen').defaultTo(false);
            table.string('date_start');
            table.string('date_end');
        })

        .createTable('event', (table) => {
            table.increments('id');
            table.integer('session_id').unsigned().references('session.id');
            table.string('start_date');
            table.boolean('ended').defaultTo(false);
            table.string('name');
            table.string('description');
            table.json('location_coords').defaultTo('{lat: 0, lon: 0}');
            table.string('location_name');
        })

        .createTable('users', (table) => {
            table.increments('id');
            table.string('uuid'); // User token, other users should NEVER see it
            table.string('public_id'); // Use this instead
            table.string('name');
            table.json('avatars').defaultTo('[]');
            table.integer('selected_avatar').unsigned().references('avatars.id');
            table.integer('tribe_id').unsigned().references('tribes.id').nullable().defaultTo(null);
            table.integer('subscribed_session').unsigned().references('session.id');
            table.string('firebase_id');
            table.boolean('admin').defaultTo(false);
            table.json('stats').defaultTo('{}');
            table.json('trophies').defaultTo('[]');
            table.integer('score').defaultTo(0);
            table.string('description').defaultTo('');
            table.string('audio').nullable().defaultTo(null);
        })

        .createTable('messages', (table) => {
            table.increments('id');
            table.boolean("admin").defaultTo(false);
            table.string('name');
            table.dateTime("date");
            table.string("uuid");
            table.string("public_id");
            table.string("message");
            table.json("reports").defaultTo('[]');
            table.boolean("deleted").defaultTo(false);
            table.integer("tribeID").defaultTo(0);
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
            table.string("color").defaultTo("cyberspace");
            table.integer("tribeID").defaultTo(0);
        })

        .createTable('feedback', (table) => {
            table.increments("id");
            table.string("username");
            table.string("message");
            table.string("date");
            table.integer("status").defaultTo(0);
        })

        .createTable('features', (table) => {
            table.increments('id');
            table.string("name");
            table.string('description');
            table.boolean("enabled").defaultTo(false);
        })

        .createTable('live-answers', (table) => {
            table.increments('id');
            table.integer('user_id').unsigned().references('users.id');
            table.string('question');
            table.string('answer');
            table.string('date');
        });

        await db.createTribe("Machines", ["#EEFE04", "#F8A539", "#8EEFFE"]);
        await db.createTribe("Animaux", ["#0391BF", "#F34D17", "#FF6FFE"]);
        await db.createTribe("Végétaux", ["#FC03CF", "#08F6F1", "#16D605"]);

        await db.createSession("Marseille", new Date('2025-03-03').toISOString(), new Date('2025-03-15').toISOString());

        // await db("users").insert({name: "Admin", uuid: "uuid-8906-8155-0f7b-7086-430d", public_id: "admin", firebase_id: "admin", admin: true, tribe_id: 3});
        
        // for (let i = 0; i < 10; i++) {
        //     const names = ["Pierre", "Marie", "Jean", "Paul", "Léa", "Léo", "Alice", "Max", "Emma", "Théo"];
        //     const name = names[Math.floor(Math.random() * names.length)];
        //     const uuid = `uuid-${i}`;
        //     const public_id = `user-${i}`;
        //     const selected_avatar = Math.random() < 0.5 ? "static_1.png" : "static_2.png";
        //     const avatarID = await db('avatars').insert({filename: selected_avatar, user_id: null}, 'id');
        //     await db("users").insert({name, uuid, public_id, selected_avatar: avatarID[0].id, tribe_id: 3});
        // }
}

// Send feedback

db.sendFeedBack = async (username, message) => {
    const feedback = await db('feedback').insert({username, message, date: new Date().toISOString(), status: 0});
    return feedback;
}

// Tribe related
//

db.createTribe = async (name, colors) => {
    const tribe = await db('tribes').insert({name: name, colors: JSON.stringify(colors)});
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
    log('Database initialized');
} else {
    await db('tribes').where('id', 1).update({name: 'Machines', colors: JSON.stringify(["#EEFE04", "#F8A539", "#8EEFFE"])});
    await db('tribes').where('id', 2).update({name: 'Animaux', colors: JSON.stringify(["#0391BF", "#F34D17", "#FF6FFE"])});
    await db('tribes').where('id', 3).update({name: 'Végétaux', colors: JSON.stringify(["#FC03CF", "#08F6F1", "#16D605"])});
}

log('Database ready '+dataPath);

export default db