// Genjob model
// The genjob object has the following properties:

// - id: the genjob id
// - userid: the user id
// - status: the genjob status
// - workflowid: the workflow id
// - userdata: the genjob user data
// - input: the genjob input
// - output: the genjob output

import db from '../tools/db.js';
import Model from './model.js';
import User from './user.js';
import Workflow from './workflow.js';

class Genjob extends Model {

    constructor() 
    {
        super('genjobs',
        {
            id: null,
            userid: null,
            last_modified: null,
            status: null,
            workflowid: null,
            userdata: null,
            input: null,
            output: null
        });
    }

    async run()
    {
        // Dummy job
        if (this.fields.id === 0 && this.fields.status == 'pending') {
            await this.status('running');
            await new Promise(r => setTimeout(r, 1000));
            await this.status('done');
            return;
        }

        console.log('Genjob', this.fields.id, 'run', this.fields.status, 'user', this.fields.userid, 'workflow', this.fields.workflowid);

        // Check user exists
        let user = new User();
        try {
            await user.load({ id: this.fields.userid });
        }
        catch (e) {
            this.fields.output = 'User not found';
            await this.status('error');
        }

        // Check workflow exists
        let workflow = new Workflow();
        await workflow.load({ id: this.fields.workflowid });
        if (!workflow.id()) {
            this.fields.output = 'Workflow not found';
            await this.status('error');
        }

        if (this.fields.status == 'error') throw new Error(this.fields.output);
        if (this.fields.status != 'pending') throw new Error('Genjob can\'t run now, status is ' + this.fields.status);

        // Mark as running
        await this.status('running');

        // run workflow and catch error
        let s;
        try {
            let result = await workflow.run(this.fields.input);
            this.fields.output = result;

            // Create Avatar
            let avatar = new Avatar();
            await avatar.new({ user_id: user.id(), url: 'https://picsum.photos/1024/1024' });
            avatars.push(avatar);

            s = 'done';
        } catch (e) {
            this.fields.output = e.message;
            s = 'error';
        }
        await this.status(s);

        if (this.fields.status == 'error') throw new Error(this.fields.output);
    }

    async status(s) {
        if (s) {
            this.fields.status = s;
            this.fields.last_modified = new Date();
            await this.save();
            console.log('Genjob', this.fields.id, 'status', this.fields.status);
        }
        // reload status
        await this.load({ id: this.fields.id });
        return this.fields.status;
    }

    async get(w, full = false) {
        if (w) await this.load(w)
        let j = await super.get()
        if (!full) {
            delete j.userdata;
            delete j.input;
            delete j.output;
        }
        return JSON.parse(JSON.stringify(j));
    }

    async next() {
        let job = await db('genjobs').where({ status: 'pending' }).orderBy('last_modified').first();
        if (job) {
            await this.load(job.id);
            return this;
        }
        else {
            console.log('No pending job');
            // dummy job
            let j = new Genjob();
            j.fields.id = 0;
            j.fields.userid = 0;
            j.fields.status = 'pending';
            j.fields.workflowid = 0;
            return j
        }
    }
}

// Create Table if not exists
db.schema.hasTable('genjobs').then(exists => {
    if (!exists) {
        db.schema.createTable('genjobs', table => {
            table.increments('id').primary();
            table.integer('userid');
            table.datetime('last_modified');
            table.string('status');
            table.integer('workflowid');
            table.string('userdata');
            table.string('input');
            table.string('output');
        })
        .then(() => {
            console.log('Table genjobs created');
        });
    }
});



export default Genjob;