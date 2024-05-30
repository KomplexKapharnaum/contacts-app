// Avatar class is a model for the avatar object. It is used to create new avatars and store them in the database.
//
// The avatar object has the following properties:
// - id: the avatar id
// - user_id: the user id
// - url: the avatar image url

import db from '../tools/db.js';

class Avatar {
    constructor() {
        this.clear()
    }

    clear() {
        this.fields = {
            id: null,
            user_id: null,
            url: null
        };
    }

    async new(user_id, url) {
        this.clear();
        this.fields.user_id = user_id;
        this.fields.url = url;
        await this.save();
    }

    async save() {
        if (!this.fields.user_id) throw new Error('Avatar user_id is required');
        if (!this.fields.url) throw new Error('Avatar url is required');

        // Insert or Update
        if (!this.fields.id) {
            let id = await db('avatars').insert(this.fields);
            this.fields.id = id[0];
            console.log('Avatar', this.fields.id, 'created');
        } else {
            await db('avatars').where({ id: this.fields.id }).update(this.fields);
            console.log('Avatar', this.fields.id, 'updated');
        }
    }

    async load(id) {
        let avatar = await db('avatars').where({ id: id }).first();
        if (avatar) this.fields = avatar;
    }

    async delete() {
        if (!this.fields.id) throw new Error('Avatar id is required');
        await db('avatars').where({ id: this.fields.id }).del();
        console.log('Avatar', this.fields.id, 'deleted');
    }

    async list(user_id) {
        let user = await db('users').where({ id: user_id }).first();
        if (!user_id || !user) throw new Error('User not found');
        return await db('avatars').where({ user_id: user_id });
    }

    async select() {
        let user = await db('users').where({ id: this.fields.user_id }).first();
        if (!user) throw new Error('User not found');
        await db('users').where({ id: this.fields.user_id }).update({ selected_avatar: this.fields.id });
        console.log('Avatar', this.fields.id, 'selected for user', this.fields.user_id);
    }

    id() { return this.fields.id; }
}

// Create Table if not exists
db.schema.hasTable('avatars').then((exists) => {
    if (!exists) {
        db.schema.createTable('avatars', (table) => {
            table.increments('id').primary();
            table.integer('user_id').notNullable();
            table.string('url').notNullable();
        }).then(() => {
            console.log('Table avatars created');
        });
    }
});

export default Avatar;