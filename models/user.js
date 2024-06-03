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
import Model from './model.js';

import cipher from '../tools/cipher.js';

import Session from './session.js';
import Avatar from './avatar.js';

import parsePhoneNumber from 'libphonenumber-js/mobile'


class User extends Model {

    constructor() 
    {
        super('users',
        {
            id:             null,
            name:           null,
            phone:          null,
            uuid:           null,
            selected_avatar: null
        });

        this.sessions = [];
        this.avatars = [];
    }

    async new(f) 
    {
        if (f.phone) f.phone = this.phoneParse(f.phone);
        return super.new(f);
    }

    async init_byphone(phone) 
    {
        // load or create user by phone number
        let phoneNumber = this.phoneParse(phone);
        let user = await db('users').where({ phone: phoneNumber }).first();
        if (user) return this.load({ uuid: user.uuid });
        else return this.new({ phone: phoneNumber });
    }

    async save() 
    {
        // mandatory fields
        if (!this.fields.phone) throw new Error('User phone is required');

        // phone + uuid
        this.phoneParse(this.fields.phone); 
        this.fields.uuid = this.generate_uuid();

        // check if uuid not already used
        let user = await db('users').where({ uuid: this.fields.uuid }).first();
        if (user && user.id != this.fields.id) throw new Error('User already exists with this phone number');

        super.save();
    }
    
    async load(w)
    {
        await super.load(w);

        let sessions = await db('users_sessions').where({ user_id: this.fields.id });
        this.sessions = sessions.map((s) => new Session().load(s.session_id));

        let avatars = await db('avatars').where({ user_id: this.fields.id });
        this.avatars = avatars.map((a) => new Avatar().load(a.id));

        return this.export()
    }

    async load_byphone(phone) {
        let phoneNumber = this.phoneParse(phone);
        let user = await db('users').where({ phone: phoneNumber }).first();
        return this.load({ uuid: user.uuid });
    }

    async set_name(uuid, name) {
        await this.load({ uuid: uuid });
        this.fields.name = name;
        await db('users').where({ id: this.fields.id }).update({ name: name });
        console.log('User', this.fields.id, 'updated with name', name);
        return this.export()
    }
    
    async delete(uuid) {
        await this.load({ uuid: uuid });

        // Delete user
        await db('users').where({ id: this.fields.id }).del();

        // Delete user sessions
        await db('users_sessions').where({ user_id: this.fields.id }).del();

        // Delete avatars
        await db('avatars').where({ user_id: this.fields.id }).del();

        console.log('User', this.fields.id, 'deleted');
    }

    async register(session_id) {
        if (!this.fields.id) throw new Error('User does not exist');
        let session = new Session();
        await session.load(session_id);
        
        // check if already registered
        let user_session = await db('users_sessions').where({ user_id: this.fields.id, session_id: session_id }).first();
        if (user_session) throw new Error('User already registered to session');

        await db('users_sessions').insert({ user_id: this.fields.id, session_id: session_id });
        
        console.log('User', this.fields.id, 'registered to session', session_id);
    }

    async unregister(session_id) {
        if (!this.fields.id) throw new Error('User does not exist');
        let session = new Session();
        await session.load(session_id);

        // check if registered
        let user_session = await db('users_sessions').where({ user_id: this.fields.id, session_id: session_id }).first();
        if (!user_session) throw new Error('User not registered to session');

        await db('users_sessions').where({ user_id: this.fields.id, session_id: session_id }).del();

        console.log('User', this.fields.id, 'unregistered from session', session_id);
    }

    async select_avatar(avatar_id) {
        if (!this.fields.id) throw new Error('User does not exist');
        await db('users').where({ id: this.fields.id }).update({ selected_avatar: avatar_id }); 
        console.log('User', this.fields.id, 'selected avatar', avatar_id);
    }

    phoneParse(phone) {
        var phoneNumber = parsePhoneNumber(phone, 'FR');
        if (!phoneNumber.isValid()) throw new Error('Invalid phone number');
        return phoneNumber.number;
    }

    generate_uuid() {
        if (!this.fields.phone) throw new Error('User phone is required');
        return cipher.encrypt(this.fields.phone);
    }

    export() {
        return {
            id: this.fields.id,
            name: this.fields.name,
            // phone: this.fields.phone,
            uuid: this.fields.uuid,
            selected_avatar: this.fields.selected_avatar,
            sessions: this.sessions.map((s) => s.id()),
            avatars: this.avatars.map((a) => a.id())
        }
    }
    
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