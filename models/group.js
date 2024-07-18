import db from '../tools/db.js';
import Model from './model.js';
import Session from './session.js';

class Group extends Model {

    constructor() {
        super('groups',
            {
                id: null,
                name: null,
                description: null,
                session_id: null
            });
        this.user = [];
    }

    clear() {
        super.clear();
        this.user = [];
    }

    async save() {
        // mandatory fields
        if (!this.fields.name) throw new Error('Group name is required');

        // Check if name not used yet by another groupe in the same session
        let event = await db('groups').where({ name: this.fields.name, session_id: this.fields.session_id }).first();
        if (event && event.id != this.fields.id) throw new Error('Group name already used');

        super.save();
    }

    async delete(w) {
        await super.delete(w);
    }
    
    async list(w) {
        if (w) return db(this.table).where(w);
        else return db(this.table).select();
    }

}

// // delete table if exists
// db.schema.dropTableIfExists('groups').then(() => {
//     console.log('dropped groups table');
// });

// Create Table if not exists
db.schema.hasTable('groups').then(exists => {
    if (!exists) {
        db.schema.createTable('groups', table => {
            table.increments('id').primary();
            table.string('name');
            table.text('description');
            table.integer('session_id');
        }).then(() => {
            console.log('created groups table');
        });
    }
});

export default Group;