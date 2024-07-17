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
import User from './user.js';
import Group from './group.js';

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
        this.groups = [];
        this.messages = []
    }

    clear() {
        super.clear();
        this.events = [];
        this.groups = [];
        this.messages = []
    }

    async load(w)
    {
        await super.load(w);

        let events = await db('events').where({ session_id: this.fields.id }).select('id');
        this.events = events.map(e => {e.id})

        let groups = await db('groups').where({ session_id: this.fields.id }).select('id');
        this.groups = groups.map(e => {e.id})

        let messages = await db('messages').where({ session_id: this.fields.id }).select('id');
        this.messages = messages.map(e => {e.id})

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
        await db('groups').where({ session_id: this.fields.id }).del();
    }

    async get(w, full = false)
    {
        if (w) await this.load(w);
        let s = await super.get();
        s.events = full ? await this.getevents() : this.events;
        s.groupe = full ? await this.getgroups() : this.groups;
        return s;
    }

    async getusers(w, full = false)
    {
        if (w) await this.load(w);
        let users = await db('users_sessions').where({ session_id: this.fields.id }).select('user_id');
        let user = new User();
        return await Promise.all(users.map(async u => {
            return await user.get(u.user_id, full);
        }))
    }

    async getevents(w)
    {
        if (w) await this.load(w);
        let event = new Event();
        return await Promise.all(this.events.map(async e => {
            return await event.get(e);
        }))
    }
    async getgroups(w)
    {
        if (w) await this.load(w);
        let groupe = new Group();
        return await Promise.all(this.groups.map(async e => {
            return await groupe.get(e);
        }))
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