import { __dirname } from '../../path.js';
import knex from 'knex';
import fs from 'fs';
import {env} from './env.js';
import path from 'path';

const dataPath = path.join(__dirname, 'database', env.DBFILE_STATIC);

// create folder if not exists
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}

const db = knex({
    client: 'sqlite3',
    connection: { filename: dataPath, },
    useNullAsDefault: true
})

async function initDB() {

    await db.schema
        .createTable('presets', (table) => {
            table.increments('id');
            table.string("group");
            table.string("name");
            table.json("data");
        })
        .createTable('tribes', (table) => {
            table.increments('id');
            table.string('name');
            table.json('colors').defaultTo('[]');
        })

        await db.createTribe("Machines", ["#EEFE04", "#F8A539", "#8EEFFE"]);
        await db.createTribe("Animaux", ["#0391BF", "#F34D17", "#FF6FFE"]);
        await db.createTribe("Végétaux", ["#FC03CF", "#08F6F1", "#16D605"]);
}

// Tribe methods

db.createTribe = async (name, colors) => {
    const tribe = await db('tribes').insert({name: name, colors: JSON.stringify(colors)});
    return tribe;
}

db.editTribe = async (id, name, colors) => {
    const tribe = await db('tribes').where('id', id).update({name: name, colors: JSON.stringify(colors)});
    return tribe;
}

db.deleteTribe = async (id) => {
    const tribe = await db('tribes').where('id', id).del();
    return tribe;
}

// Presets methods

db.createPreset = async (name, group, data) => {
    const preset = await db('presets').insert({name: name, group: group, data: JSON.stringify(data)});
    return preset;
}

db.editPreset = async (id, name, group, data) => {
    const preset = await db('presets').where('id', id).update({name: name, group: group, data: JSON.stringify(data)});
    return preset;
}

db.deletePreset = async (id) => {
    const preset = await db('presets').where('id', id).del();
    return preset;
}

if (!fs.existsSync(dataPath)) initDB();

export default db