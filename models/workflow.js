// Workflow model
// The workflow object has the following properties:

// - id: the workflow id
// - name: the workflow name
// - path: the workflow path

import db from '../tools/db.js';
import Model from './model.js';

class Workflow extends Model {

    constructor() 
    {
        super('workflows',
        {
            id: null,
            name: null,
            path: null
        });
    }

    async save() 
    {
        // mandatory fields
        if (!this.fields.name) throw new Error('Workflow name is required');
        if (!this.fields.path) throw new Error('Workflow path is required');

        await super.save();
    }

    async run(input)
    {
        // Check if workflow exists
        let workflow = new Workflow();
        await workflow.load({ id: this.fields.id });
        if (!workflow.id()) throw new Error('Workflow not found');

        await new Promise(r => setTimeout(r, 5000));
        
        // do someting with input
        // ...
        // throw if error occurs
        // ...
        // return file

        return 'ok';
    }

}

// Create table if not exists
db.schema.hasTable('workflows').then(exists => {
    if (!exists) {
        db.schema.createTable('workflows', table => {
            table.increments('id').primary();
            table.string('name');
            table.string('path');
        }).then(() => {
            console.log('Table workflows created');
        });
    }
});


export default Workflow;