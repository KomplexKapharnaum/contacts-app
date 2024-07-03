import db from '../tools/db.js';
import Model from './model.js';

class Message extends Model {
    
    constructor() 
    {
        super('Messages',
        {
            id:             null,
            data:           null,
            emit_time:      null,
            message:        null,
        });
    }
    
    async load(w)
    {
        await super.load(w);

        for (let e of user) {
            let message = new Message();
            message.fields = e;
            this.user.push(message);
        }

        return this.get()
    }

    clear() {
        super.clear();
    }

    async save() 
    {
        // mandatory fields
        if (!this.fields.message) throw new Error('Message is required');

        super.save();
    }

    async delete(w)
    {
        await super.delete(w);
    }

    async getgroupes(w)
    {
        if (w) await this.load(w);
        return await Promise.all(this.user.map(e.get()));
    }

}

// Create Table if not exists
db.schema.hasTable('Messages').then(exists => {
    if (!exists) {
        db.schema.createTable('Messages', table => {
            table.increments('id').primary();
            table.string('data');
            table.text('emit_time');
            table.integer('message');
        }).then(() => {
            console.log('created Messages table');
        });
    }
});

export default Message;