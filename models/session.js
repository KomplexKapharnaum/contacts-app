// Session class is a model for the session object. It is used to create new sessions and store them in the database.
//
// The session object has the following properties:
// - id: the session id
// - name: the session name
// - starting_at: the session starting time (can be null)
// - ending_at: the session ending time (can be null)
//

import db from '../tools/db.js';
import Model from './model.js';
import Event from './event.js';

class Session extends Model {

    constructor() 
    {
        super('sessions', 
        {
            id:             null,
            name:           null,
            starting_at:    null,
            ending_at:      null
        })

        this.events = [];
    }

    clear() {
        super.clear();
        this.events = [];
    }

    async load(w)
    {
        await super.load(w);

        let events = await db('events').where({ session_id: this.fields.id });
        for (let e of events) {
            let event = new Event();
            event.fields = e;
            this.events.push(event);
        }

        return this.export()
    }
    
    async save() 
    {
        // mandatory fields
        if (!this.fields.name) throw new Error('Session name is required');

        // Check if name not used yet by another session
        let session = await db('sessions').where({ name: this.fields.name }).first();
        if (session && session.id != this.fields.id) throw new Error('Session name already used');

        super.save();
    }

    async delete(w)
    {
        await super.delete(w);
        await db('events').where({ session_id: this.fields.id }).del();
    }

    async export(w, full = false)
    {
        if (w) await this.load(w);
        let s = await super.export();
        s.events = await Promise.all(this.events.map(e => (full) ? e.export() : e.id()));
        return s;
    }

    async next()
    {
        let session = await db('sessions').where('ending_at', '>', db.fn.now()).orderBy('starting_at').first();
        if (!session) throw new Error('No upcoming session');
        return session.id;
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