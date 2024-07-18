import db from '../tools/db.js';
import Model from './model.js';

class Message extends Model {

    constructor() {
        super('messages',
            {
                id: null,
                data: null,
                emit_time: null,
                message: null,
                session: null,
                groupe_id: null
            });
    }

    async load(w) {
        await super.load(w);

        for (let e of user) {
            let message = new Message();
            message.fields = e;
            this.user.push(message);
        }

        return this.get()
    }

    async save() {
        // mandatory fields
        if (!this.fields.message) throw new Error('Message is required');
        if (this.fields.groupe_id == '') this.fields.groupe_id = null

        super.save();
    }

    async list(w) {
        if (w) {
            return await super.list(w)
        }
        return db(this.table)
    }

    async last(w) {
        return db(this.table)
            .orderBy("emit_time", "desc")
            .limit(1)
            .where(w)
    }

    async verify(message, session, group) {

        let verif_check = true

        // check group is null or exists !
        db.select("groups.id")
            .from("groups")
            .where({ id: group })
            .then((groups) => {
                if (groups.length > 0) {
                    groups.forEach((g) => {
                        console.log("groups : " + g.id)
                    })
                } else if (!group || group == '') {
                    group = null
                    console.log("group_id is set to null")
                } else {
                    verif_check = false
                    return (console.log("group not found"));
                }
            })

        // check session exists !
        db.select("sessions.id")
            .from("sessions")
            .where({ id: session })
            .then((res) => {
                if (res.length == 0) {
                    console.log("session not found");
                    return verif_check = false
                }
            })

        // check message is not empty !
        if (message == '') {
            verif_check = false
            return (console.log("message empty"))
        };
        setTimeout(() => {
            if (verif_check === true) {
                this.send(message, session, group)
            }
        }, 1000)
        return verif_check
    }

    async send(message, session, group) {

        let time_stamp = Date.now()

        db('Messages').insert({ message: message, emit_time: time_stamp, session_id: session, group_id: group }).then(
            console.log("msg send : " + message)
        );

        db("users").select("is_connected", "phone").then((users) => {
            users.forEach((u) => {
                if (u.is_connected == 0) {
                    sendSMS([u.phone], "nouveau message ! contacts.kxkm.net")
                }
            })
        })
        return true
    }
}


// Create Table if not exists
db.schema.hasTable('messages').then(exists => {
    if (!exists) {
        db.schema.createTable('messages', table => {
            table.increments('id').primary();
            table.string('data');
            table.integer('emit_time');
            table.string('message');
            table.integer('session_id')
            table.integer('group_id')

        }).then(() => {
            console.log('created messages table');
        });
    }
});

export default Message;