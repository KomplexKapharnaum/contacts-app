import db from '../tools/db.js';
import Model from './model.js';

class Groupe extends Model {

    constructor() {
        super('Groupes',
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
            let groupe = new Groupe();
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
        if (!this.fields.name) throw new Error('Groupe name is required');

        // Check if name not used yet by another groupe in the same session
        let event = await db('Groupes').where({ name: this.fields.name, session_id: this.fields.session_id }).first();
        if (event && event.id != this.fields.id) throw new Error('Groupe name already used');

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

        // find Groupe
        let groupe = new Session();
        await groupe.load(this.fields.user_id);

        return await groupe.getusers();
    }

    async getgroupes(w) {
        if (w) await this.load(w);
        return await Promise.all(this.user.map(e.get()));
    }

    async list(w) {
        if (w) return db(this.table).where(w);
        else return db(this.table).select();
    }

}

// Create Table if not exists
db.schema.hasTable('Groupes').then(exists => {
    if (!exists) {
        db.schema.createTable('Groupes', table => {
            table.increments('id').primary();
            table.string('name');
            table.text('description');
            table.integer('user_id');
            table.integer('session_id');
        }).then(() => {
            console.log('created Groupes table');
        });
    }
});

export default Groupe;