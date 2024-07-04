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
import Groupe from './groupe.js';

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
        this.groupe = [];
        this.message = []
    }

    clear() {
        super.clear();
        this.events = [];
        this.groupe = [];
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
        let groupe = await db('Groupes').where({ session_id: this.fields.id });
        for (let e of groupe) {
            let event = new Groupe();
            event.fields = e;
            this.groupe.push(groupe);
        }

        return this.get()
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
        await db('Groupes').where({ session_id: this.fields.id }).del();
    }

    async get(w, full = false)
    {
        if (w) await this.load(w);
        let s = await super.get();
        s.events = await Promise.all(this.events.map(e => (full) ? e.get() : e.id()));
        s.groupe = await Promise.all(this.groupe.map(e => (full) ? e.get() : e.id()));
        s.users = await this.getusers();
        return s;
    }

    async getusers(w)
    {
        if (w) await this.load(w);
        let users = await db('users_sessions').where({ session_id: this.fields.id });
        return await Promise.all(users.map(async u => {
                let user = new User();
                await user.load(u.user_id);
                return await user.get();
            })
        ) 
    }

    async getevents(w)
    {
        if (w) await this.load(w);
        return await Promise.all(this.events.map(e.get()));
    }
    async getgroupe(w)
    {
        if (w) await this.load(w);
        return await Promise.all(this.groupe.map(e.get()));
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