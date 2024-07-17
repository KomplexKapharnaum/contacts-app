// Event class is a model for the event object. It is used to create new events and store them in the database.
//
// The event object has the following properties:
// - id: the event id
// - name: the event name
// - starting_at: the event starting time (can be null)
// - ending_at: the event ending time (can be null)
// - location: the event location
// - description: the event description
// - session_id: the session id the event belongs to
//

import e from 'express';
import db from '../tools/db.js';
import Model from './model.js';
import Session from './session.js';

class Event extends Model {
    
    constructor() 
    {
        super('events',
        {
            id:             null,
            name:           null,
            starting_at:    null,
            ending_at:      null,
            location:       null,
            description:    null,
            session_id:     null
        });
    }
    
    async save() 
    {
        // mandatory fields
        if (!this.fields.name) throw new Error('Event name is required');

        // Check if name not used yet by another event in the same session
        let event = await db('events').where({ name: this.fields.name, session_id: this.fields.session_id }).first();
        if (event && event.id != this.fields.id) throw new Error('Event name already used');

        super.save();
    }

    async getusers(w) {
        if (w) await this.load(w);
        
        // find session
        let session = new Session();
        return await session.getusers(this.fields.session_id);
    }

}

// Create Table if not exists
db.schema.hasTable('events').then(exists => {
    if (!exists) {
        db.schema.createTable('events', table => {
            table.increments('id').primary();
            table.string('name');
            table.datetime('starting_at');
            table.datetime('ending_at');
            table.string('location');
            table.text('description');
            table.integer('session_id');
        }).then(() => {
            console.log('created events table');
        });
    }
});

export default Event;