// Avatar class is a model for the avatar object. It is used to create new avatars and store them in the database.
//
// The avatar object has the following properties:
// - id: the avatar id
// - user_id: the user id
// - url: the avatar image url

import db from '../tools/db.js';
import Model from './model.js';

class Avatar extends Model {

    constructor() 
    {
        super('avatars',
        {
            id: null,
            user_id: null,
            url: null
        });
    }

    async save() 
    {
        // mandatory fields
        if (!this.fields.user_id) throw new Error('Avatar user_id is required');
        if (!this.fields.url) throw new Error('Avatar url is required');

        super.save();
    }

    async select()
    {
        let user = await db('users').where({ id: this.fields.user_id }).first();
        if (!user) throw new Error('User not found');
        await db('users').where({ id: this.fields.user_id }).update({ selected_avatar: this.fields.id });
        console.log('Avatar', this.fields.id, 'selected for user', this.fields.user_id);
    }

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