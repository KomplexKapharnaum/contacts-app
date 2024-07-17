import db from '../tools/db.js';
import Model from './model.js';

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

    async load(w) {
        await super.load(w);

        let user = await db('user').where({ groupe_id: this.fields.id });
        for (let e of user) {
            let groupe = new Group();
            groupe.fields = e;
            this.user.push(groupe);
        }

        return this.get()
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
        await db('user').where({ groupe_id: this.fields.id }).del();
    }

    async get(w, full = false) {
        if (w) await this.load(w);
        let s = await super.get();
        s.user = await Promise.all(this.user.map(e => (full) ? e.get() : e.id()));
        s.users = await this.getusers();
        return s;
    }

    async getusers(w) {
        if (w) await this.load(w);

        // find Sessions
        let groupe = new Session();
        await groupe.load(this.fields.user_id);

        return await groupe.getusers();
    }

    async list(w) {
        if (w) return db(this.table).where(w);
        else return db(this.table).select();
    }

}

// delete table if exists
db.schema.dropTableIfExists('Groupes').then(() => {
    console.log('dropped Groupes table');
});

// Create Table if not exists
db.schema.hasTable('groups').then(exists => {
    if (!exists) {
        db.schema.createTable('groups', table => {
            table.increments('id').primary();
            table.string('name');
            table.text('description');
            table.integer('user_id');
            table.integer('session_id');
        }).then(() => {
            console.log('created groups table');
        });
    }
});

export default Group;