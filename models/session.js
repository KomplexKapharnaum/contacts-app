// Session class is a model for the session object. It is used to create new sessions and store them in the database.
//
// The session object has the following properties:
// - id: the session id
// - name: the session name
// - starting_at: the session starting time (can be null)
// - ending_at: the session ending time (can be null)
//

import db from '../tools/db.js';

class Session {
    constructor() {
        this.clear()
    }

    clear() {
        this.fields = {
            id: null,
            name: null,
            starting_at: null,
            ending_at: null
        };
    }

    async new(name) {
        this.clear();
        this.fields.name = name;
        await this.save();
    }
    
    async save() {
        if (!this.fields.name) throw new Error('Session name is required');

        // Check if name not used yet by another session
        let session = await db('sessions').where({ name: this.fields.name }).first();
        if (session && session.id != this.fields.id) throw new Error('Session name already used');

        // Insert or Update
        if (!this.fields.id) {
            let id = await db('sessions').insert(this.fields);
            this.fields.id = id[0];
            console.log('Session', this.fields.id, 'created');
        } else {
            await db('sessions').where({ id: this.fields.id }).update(this.fields);
            console.log('Session', this.fields.id, 'updated');
        }
    }

    async load(id) {
        let session = await db('sessions').where({ id: id }).first();
        if (session) this.fields = session;
    }

    async delete(id) {
        if (id) await this.load(id)
        if (!this.fields.id) throw new Error('Session id not found');
        await db('sessions').where({ id: this.fields.id }).del();
        console.log('Session', this.fields.id, 'deleted');
    }

    async list() {
        return db('sessions').select();
    }

    id() {
        return this.fields.id;
    }
}


// Create Table if not exists
db.schema.hasTable('sessions').then(exists => {
    if (!exists) {
        db.schema.createTable('sessions', table => {
            table.increments('id').primary();
            table.string('name');
            table.datetime('starting_at');
            table.datetime('ending_at');
        }).then(() => {
            console.log('created sessions table');
        });
    }
});


export default Session;