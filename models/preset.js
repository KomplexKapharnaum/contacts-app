
// Presets class is a model for the preset object. It is used to create new presets and store them in the database.
//
// The preset object has the following properties:
// - id: the preset id
// - name: the preset name
// - data: the preset data in json
// - group: the preset group name
//

import db from '../tools/db.js';
import Model from './model.js';

class Preset extends Model {
    
    constructor() 
    {
        super('presets', 
        {
            id:             null,
            name:           null,
            data:           null,
            group:          null
        })
    }

    async getByGroup(group) {
        return await db('presets').where({ group: group }).select('*');
    }
}

// Create Table if not exists
db.schema.hasTable('presets').then((exists) => {
    if (!exists) {
        db.schema.createTable('presets', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.string('data');
            table.string('group');
        }).then(() => {
            console.log("Table 'presets' created");
        });
    }
});

export default Preset;

