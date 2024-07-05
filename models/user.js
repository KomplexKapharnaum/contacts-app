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
import Genjob from './genjob.js';

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
            selected_avatar: null,
            groupe_id:      null,
            last_read:      null,
            is_connected:   null
        });

        this.sessions = [];
        this.avatars = [];
        this.genjobs = [];
    }

    clear() {
        super.clear();
        this.sessions = [];
        this.avatars = [];
        this.genjobs = [];
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
        
        await super.save();
    }
    
    async load(w)
    {
        await super.load(w);

        // TODO: LAZY OR CONCURRENT LOAD...

        let sessions = await db('users_sessions').where({ user_id: this.fields.id });
        for (let s of sessions) {
            let session = new Session();
            await session.load(s.session_id);
            this.sessions.push(session);
        }

        let avatars = await db('avatars').where({ user_id: this.fields.id });
        for (let a of avatars) {
            let avatar = new Avatar();
            await avatar.load(a.id);
            this.avatars.push(avatar);
        }

        let genjobs = await db('genjobs').where({ userid: this.fields.id });
        for (let g of genjobs) {
            let genjob = new Genjob();
            await genjob.load(g.id);
            this.genjobs.push(genjob);
        }

        return this.get()
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
        return this.get()
    }
    
    async delete(uuid) {
        await this.load({ uuid: uuid });

        // Delete user
        await db('users').where({ id: this.fields.id }).del();

        // Delete user sessions
        await db('users_sessions').where({ user_id: this.fields.id }).del();

        // Delete avatars
        await db('avatars').where({ user_id: this.fields.id }).del();

        // Delete genjobs
        await db('genjobs').where({ userid: this.fields.id }).del();

        // Delete groupe_id
        await db('groupe_id').where({ user_id: this.fields.id }).del();

        // Delete last_read
        await db('last_read').where({ user_id: this.fields.id }).del();

        console.log('User', this.fields.id, 'deleted');
    }

    async register(uuid, session_id) {
        if (uuid) await this.load({ uuid: uuid });
        if (!this.fields.id) throw new Error('User does not exist');
        let session = new Session();
        await session.load(session_id);
        
        // check if already registered
        let user_session = await db('users_sessions').where({ user_id: this.fields.id, session_id: session_id }).first();
        if (user_session) throw new Error('User already registered to session');

        await db('users_sessions').insert({ user_id: this.fields.id, session_id: session_id });
        console.log('User', this.fields.id, 'registered to session', session_id);
    }

    async unregister(uuid, session_id) {
        if (uuid) await this.load({ uuid: uuid });
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

    async get(w, full = false) {
        if (w) await this.load(w);
        let u = await super.get();
        delete u.phone;

        if (this.fields.selected_avatar !== null && full) {
            try {
                let avatar = new Avatar();
                await avatar.load(this.fields.selected_avatar);
                u.selected_avatar = await avatar.get();
            } catch (e) {
                u.selected_avatar = null;
            }
        }

        u.sessions = await Promise.all(this.sessions.map(s => (full ? s.get(null,true) : s.id())));
        u.avatars = await Promise.all(this.avatars.map(a => (full ? a.get() : a.id())));
        u.genjobs = await Promise.all(this.genjobs.map(g => (full ? g.get() : g.id())));

        return u;
    }
    
    async switch_connect(w, state){
        if (state == true) {
            await db('users').update("is_connected", 1).where(w);
        } else{
            await db('users').update("is_connected", 0).where(w);
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
            table.integer('groupe_id');
            table.integer('last_read');
            table.integer('is_connected');

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