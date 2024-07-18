import db from '../tools/db.js';
import Model from './model.js';
import sendSMS from '../tools/sms_hico.js';

class Sms extends Model {

    constructor() {
        super('sms',
            {
                id: null,
                emit_time: null,
                message: null,
                session: null,
                groupe_id: null
            });
    }

    async load(w) {
        await super.load(w);

        for (let e of user) {
            let sms = new Sms();
            sms.fields = e;
            this.user.push(sms);
        }

        return this.get()
    }

    async save() {
        // mandatory fields
        if (!this.fields.message) throw new Error('Message is required');

        super.save();
    }

    async list(w) {
        if (w) {
            return await super.list(w)
        }
        return db(this.table)
    }

    async register(sms_msg) {

        await db('sms').insert({ message: sms_msg });
        console.log('Sms enregistrer : ', sms_msg);
    }

    async sendSms(msg, request) {
        console.log("into sendsms")
        if (/\|/.test(request)) {
            console.log("into sendsms all")
            
            request = request.replace(/\|/, '')
            console.log("requete : " + request)
            
            db.select("*")
            .from("users_sessions")
            .join('users', 'users.id', '=', 'users_sessions.user_id')
            .join('sessions', 'sessions.id', '=', 'users_sessions.session_id')
            .where({ "users_sessions.session_id": request })
            .then((phone) => {
                phone.forEach((p) => {
                    console.log(p)
                    sendSMS([p.phone], msg)
                })
            })
            
            // @ balise de reco pour groupe
        } else if (/@/.test(request)) {
            console.log("into sendsms group")
            request = request.replace(/@/, '')
            
            //  TODO FIX XML ERROR PARSING
            db.select("*")
            .from("users_groups")
            .join("users", "users_groups.group_id", "=", "groups.id")
            .join("groups", "groups.id", "=", "users_groups.group_id")
            .where({ "groups.id": request })
            .then((users) => {
                users.forEach((u) => {
                    console.log(u.phone)
                    sendSMS([u.phone], msg)
                })
            })
        } else {
            console.log("into sendsms SIMPLE")
            sendSMS([request], msg)
        }
    }
}

// Create Table if not exists
db.schema.hasTable('sms').then(exists => {
    if (!exists) {
        db.schema.createTable('sms', table => {
            table.increments('id').primary();
            table.string('message');

        }).then(() => {
            console.log('created sms table');
        });
    }
});

export default Sms;