// User class is a model for the user object. It is used to create new user and store them in the database.
//
// The user object has the following properties:
// - id: the user id
// - name: the user name
// - phone: the user phone number
// - uuid: the user unique identifier derived from the phone number encrypted by cipher.js
// - selected_avatar: the selected avatar id
// - sessions: the list of session id the user is registered to
// - avatars: the list of avatars id the user has
//

import db from '../tools/db.js';

import cipher from '../tools/cipher.js';

import Session from './session.js';
import Avatar from './avatar.js';

import parsePhoneNumber from 'libphonenumber-js/mobile'


class User {
    constructor() {
        this.clear()
    }

    clear() {
        this.fields = {
            id: null,
            name: null,
            phone: null,
            uuid: null,
            selected_avatar: null
        };
        
        this.sessions = [];
        this.avatars = [];
    }

    async new(name, phone) 
    {
        this.clear()
        this.fields.name = name;
        this.fields.phone = this.phoneParse(phone).number;
        await this.save();
    }
    
    async save() {
        if (!this.fields.name) throw new Error('User name is required');
        if (!this.fields.phone) throw new Error('User phone is required');

        let phoneNumber = this.phoneParse(this.fields.phone);
        if (!phoneNumber || !phoneNumber.isValid()) throw new Error('Invalid phone number');

        this.fields.uuid = this.generate_uuid();

        // NEW : check if uuid not already used, then insert
        if (!this.fields.id) {
            let user = await db('users').where({ uuid: this.fields.uuid }).first();
            if (user) throw new Error('User already exists with this phone number');

            this.fields.id = await db('users').insert(this.fields);
            console.log('User', this.fields.name, 'created with id', this.fields.id);
        }
        // UPDATE : 
        else {
            await db('users').where({ id: this.fields.id }).update(this.fields);
            console.log('User', this.fields.id, 'updated');
        }
    }

    async load(uuid) {
        let user = await db('users').where({ uuid: uuid }).first();
        if (user) this.fields = user;

        let sessions = await db('users_sessions').where({ user_id: this.fields.id });
        this.sessions = sessions.map((s) => new Session(s.session_id));

        let avatars = await db('avatars').where({ user_id: this.fields.id });
        this.avatars = avatars.map((a) => new Avatar(a.id));
    }

    async delete(uuid) {
        if (uuid) this.load(uuid);
        if (!this.fields.id) throw new Error('User does not exist');

        // Delete user
        await db('users').where({ id: this.id }).del();

        // Delete avatars
        await db('avatars').where({ user_id: this.id }).del();

        console.log('User', this.id, 'deleted');
    }

    async register(session_id) {
        if (!this.fields.id) throw new Error('User does not exist');
        let session = new Session();
        await session.load(session_id);
        if (!session.id) throw new Error('Session does not exist');
        await db('users_sessions').insert({ user_id: this.fields.id, session_id: session_id });
        console.log('User', this.fields.id, 'registered to session', session_id);
    }

    async unregister(session_id) {
        if (!this.fields.id) throw new Error('User does not exist');
        let session = new Session();
        await session.load(session_id);
        if (!session.id) throw new Error('Session does not exist');
        await db('users_sessions').where({ user_id: this.fields.id, session_id: session_id }).del();
        console.log('User', this.fields.id, 'unregistered from session', session_id);
    }

    async select_avatar(avatar_id) {
        if (!this.fields.id) throw new Error('User does not exist');
        await db('users').where({ id: this.fields.id }).update({ selected_avatar: avatar_id }); 
        console.log('User', this.fields.id, 'selected avatar', avatar_id);
    }

    async list() {
        return db('users').select();
    }

    phoneParse(phone) {
        return parsePhoneNumber(phone, 'FR');
    }

    generate_uuid() {
        if (!this.fields.phone) throw new Error('User phone is required');
        return cipher.encrypt(this.fields.phone);
    }

    id() { return this.fields.id; }

}


// Create Table if not exists
db.schema.hasTable('users').then(exists => {
    if (!exists) {
        db.schema.createTable('users', table => {
            table.increments('id').primary();
            table.string('name');
            table.string('phone');
            table.string('uuid');
            table.integer('selected_avatar');
        }).then(() => {
            console.log('created users table');
        });
    }
});

db.schema.hasTable('users_sessions').then(exists => {
    if (!exists) {
        db.schema.createTable('users_sessions', table => {
            table.integer('user_id');
            table.integer('session_id');
        }).then(() => {
            console.log('created users_sessions table');
        });
    }
});

export default User;