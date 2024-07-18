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
}

// delete table if exists
db.schema.dropTableIfExists('Messages').then(() => {
    console.log('dropped Messages table');
});

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