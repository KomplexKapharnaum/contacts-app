// Session class is a model for the session object. It is used to create new sessions and store them in the database.
//
// The session object has the following properties:
// - id: the session id
// - name: the session name
// - starting_at: the session starting time (can be null)
// - ending_at: the session ending time (can be null)
//

import db from '../db.js';

class Session {
    constructor() {
        this.id = null;
        this.name = null;
        this.starting_at = null;
        this.ending_at = null;
    }

    async new(name) {
        // check if name is already used
        let session = await db('sessions').where({ name: name }).first();
        if (session) throw new Error('Session name already used');

        this.name = name;
        await this.save();
    }
    
    async save() {
        if (!this.name) throw new Error('Session name is required');
        await db('sessions').insert({
            name: this.name,
            starting_at: this.starting_at,
            ending_at: this.ending_at
        });
        console.log('Session', this.name, 'saved');
    }

    async load(id) {
        let session = await db('sessions').where({ id: id }).first();
        if (session) {
            this.id = session.id;
            this.name = session.name;
            this.starting_at = session.starting_at;
            this.ending_at = session.ending_at;
        }
    }

    async delete() {
        if (!this.id) throw new Error('Session id is required');
        await db('sessions').where({ id: this.id }).del();
        console.log('Session', this.id, 'deleted');
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