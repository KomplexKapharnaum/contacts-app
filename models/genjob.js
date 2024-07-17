// Genjob model
// The genjob object has the following properties:

// - id: the genjob id
// - userid: the user id
// - status: the genjob status
// - workflow: the workflow name (matching <workflow>.js and <workflow>.json files in ./workflows)
// - userdata: the genjob user data
// - input: the genjob input
// - output: the genjob output

import db from '../tools/db.js';
import Model from './model.js';
import User from './user.js';
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

var jobsCallbacks = {};

class Genjob extends Model {

    constructor() 
    {
        super('genjobs',
        {
            id: null,
            userid: null,
            last_modified: null,
            status: null,
            workflow: null,
            input: null,
            output: null
        });
    }

    async new(f) 
    {   
        // check if user exists
        let user = new User();
        await user.load({ id: f.userid });

        // check if <workflow>.js and <workflow>.json files exist using fs 
        if (!fs.existsSync('workflows/' + f.workflow + '.js')) throw new Error('workflows/' + f.workflow + '.js not found');
        if (!fs.existsSync('workflows/' + f.workflow + '.json')) throw new Error('workflows/' + f.workflow + '.json not found');

        this.fields.userid = f.userid;
        this.fields.status = 'pending';
        this.fields.last_modified = new Date();
        this.fields.workflow = f.workflow;
        this.fields.input = f.input;

        await this.save();
        return this.fields.id;
    }

    async run()
    {
        // Dummy job (wait 1s)
        if (this.fields.id == -1) {
            await new Promise(r => setTimeout(r, 1000));
            return;
        }

        console.log('Genjob', this.fields.id, 'run', this.fields.status, 'user', this.fields.userid, 'workflow', this.fields.workflow);

        // Check if job is loaded and pending
        if (!this.fields.id) throw new Error('Genjob not loaded');
        if (this.fields.status != 'pending') throw new Error('Genjob can\'t run now, status is ' + this.fields.status);

        // Mark as running
        await this.status('running');
        
        // run workflow and catch error
        let s;
        try {
            // Check user exists
            let user = new User();
            await user.load({ id: this.fields.userid });

            // Load <workflow>.json file from ./workflows path
            let wjson = fs.readFileSync('workflows/' + this.fields.workflow + '.json', 'utf8');
            
            // Parse JSON
            wjson = JSON.parse(wjson);

            // Load <workflow>.js file from ./workflows path
            let wjs = await import('../workflows/' + this.fields.workflow + '.js');
            
            // Run workflow
            this.fields.output = await wjs.run(process.env.COMFY_API_URL, wjson, this.fields.input);
            s = 'done';
        } 
        catch (e) {
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
        }
        // reload status
        await this.load({ id: this.fields.id });

        // callback
        if (jobsCallbacks[this.fields.id] && jobsCallbacks[this.fields.id][this.fields.status]) {
            jobsCallbacks[this.fields.id][this.fields.status](this);
        }

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
            // console.log('No pending job');
            // dummy job
            let j = new Genjob();
            j.fields.id = -1;
            return j
        }
    }

    async retry(w) {
        if (w) await this.load(w)
        await this.status('pending')
    }

    on(e, cb) {
        if (!this.fields.id) throw new Error('Genjob not loaded');
        jobsCallbacks[this.fields.id] = jobsCallbacks[this.fields.id] || {};
        jobsCallbacks[this.fields.id][e] = cb;
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
            table.string('workflow');
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