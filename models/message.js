import db from '../tools/db.js';
import Model from './model.js';

class Message extends Model {

    constructor() {
        super('Messages',
            {
                id:         null,
                data:       null,
                emit_time:  null,
                message:    null,
                session:    null
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

    async delete(w) {
        await super.delete(w);
        await db('Messages').where({ session_id: this.fields.id }).del();
    }

    async list(w) {
        if (w) {
            return db(this.table).where("emit_time", '>', w)
        }
        return db(this.table)
    }

}

// Create Table if not exists
db.schema.hasTable('Messages').then(exists => {
    if (!exists) {
        db.schema.createTable('Messages', table => {
            table.increments('id').primary();
            table.string('data');
            table.integer('emit_time');
            table.string('message');
            table.integer('session_id')
        }).then(() => {
            console.log('created Messages table');
        });
    }
});

export default Message;