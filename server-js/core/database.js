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

        // .createTable('tribes', (table) => {
        //     table.increments('id');
        //     table.string('name');
        //     table.json('colors').defaultTo('[]');
        //     // table.integer('score').defaultTo(0);
        // })

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
            
            table.boolean('priority').defaultTo(false);
            table.integer('tribe_id').unsigned().defaultTo(0);
        })

        .createTable('users', (table) => {
            table.increments('id');
            table.string('uuid'); // User token, other users should NEVER see it
            table.string('public_id'); // Use this instead
            table.string('name');
            table.json('avatars').defaultTo('[]');
            table.integer('selected_avatar').unsigned().references('avatars.id');
            table.integer('tribe_id').unsigned().nullable().defaultTo(null);
            table.integer('subscribed_session').unsigned().references('session.id');
            table.string('firebase_id');
            table.boolean('admin').defaultTo(false);
            table.json('stats').defaultTo('{}');
            table.json('trophies').defaultTo('[]');
            table.integer('score').defaultTo(0);
            table.string('description').defaultTo('');
            table.string('audio').nullable().defaultTo(null);
            table.dateTime('last_seen').defaultTo(null);
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

        // .createTable('presets', (table) => {
        //     table.increments('id');
        //     table.string("group");
        //     table.string("name");
        //     table.json("data");
        // })

        .createTable('notifications', (table) => {
            table.increments('id');
            table.dateTime("created_at");
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

        // await db.createTribe("Machines", ["#EEFE04", "#F8A539", "#8EEFFE"]);
        // await db.createTribe("Animaux", ["#0391BF", "#F34D17", "#FF6FFE"]);
        // await db.createTribe("Végétaux", ["#FC03CF", "#08F6F1", "#16D605"]);

        await db.createSession("current", new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) );
}

// Send feedback

db.sendFeedBack = async (username, message) => {
    const feedback = await db('feedback').insert({username, message, date: new Date().toISOString(), status: 0});
    return feedback;
}

// Message related
//

db.createMessage = async (admin, name, date, uuid, public_id, message, tribeID) => {
    const msg = await db('messages').insert({admin, name, uuid, public_id, message, date, tribeID});
    return msg;
}

db.createNotification = async(message, color, tribeID=0) => {
    const msg = await db('notifications').insert({message, tribeID, color, created_at: new Date()});
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

db.createEvent = async (session_id, start_date, name, description, location_coords, location_name, priority) => {
    const event = await db('event').insert({
        session_id, 
        start_date: new Date(start_date).toISOString(), 
        name, 
        description, 
        location_coords, 
        location_name,
        priority
    });
    return event;
}

db.endEvent = async (id) => {
    const event = await db('event').where('id', id).update({ended: true});
    return event;
}

// Archive & reset
//

db.archive = async () => {
    if (fs.existsSync(dataPath)) {
        await db.client.destroy();
        const archiveName = `db-${new Date().toISOString().slice(0, 10)}.db`;
        const archivePath = path.join(__dirname, 'db_archive', archiveName);
        fs.renameSync(dataPath, archivePath);
    }
    initDB();
}

// db.new = async() => initDB();

// INIT DB
//
if (!fs.existsSync(dataPath)) {
    await initDB();
    log('Database initialized');
}

// Add stats_visitors table if not exists
// columns: date, count
await db.schema.hasTable('stats_visitors').then(async (exists) => {
    if (!exists) {
        await db.schema.createTable('stats_visitors', (table) => {
            table.timestamp('date').primary();
            table.integer('count').defaultTo(0);
        });
    }
});

log('Database ready '+dataPath);

export default db