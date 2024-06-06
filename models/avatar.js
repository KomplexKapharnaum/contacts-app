// Avatar class is a model for the avatar object. It is used to create new avatars and store them in the database.
//
// The avatar object has the following properties:
// - id: the avatar id
// - user_id: the user id
// - url: the avatar image url

const AVATAR_GEN_SIZE = 2;

import db from '../tools/db.js';
import Model from './model.js';
import User from './user.js';
import Genjob from './genjob.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const uploadDir = path.join(__dirname, '../upload');

class Avatar extends Model {

    constructor() 
    {
        super('avatars',
        {
            id: null,
            user_id: null,
            url: null
        });
    }

    async save() 
    {
        // mandatory fields
        if (!this.fields.user_id) throw new Error('Avatar user_id is required');
        if (!this.fields.url) throw new Error('Avatar url is required');

        await super.save();
    }

    async select(uuid, id) 
    {
        let user = new User();
        await Promise.all([
            user.load({ uuid: uuid }), 
            this.load(id)
        ])
        if (this.fields.user_id != user.id()) throw new Error('Avatar not found');
        await user.update(null, { selected_avatar: id });
        console.log('Avatar', id, 'selected for user', user.id());
    }

    async generate(uuid, data) 
    {   
        // check if user exists
        let user = new User();
        await user.load({ uuid: uuid });

        if (!data.pic) throw new Error('Base pic is required');

        // save uploaded data.pic from dataURL to upload folder
        let filename = path.join(uploadDir, user.id() + '_' + Date.now() + '.png');
        let dataURL = data.pic.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(filename, dataURL, 'base64');

        // delete all not selected avatars for this user
        let req = db('avatars').where({ user_id: user.id() })
        if (user.selected_avatar) req.whereNot({ id: user.selected_avatar });
        await req.del();
        
        // add selected avatar if exists
        let already = 0;
        if (user.selected_avatar) {
            let avatar = new Avatar();
            try {
                await avatar.load(user.selected_avatar);
                already += 1;
            } catch (e) {
                await user.update(null, { selected_avatar: null });
            }
        }

        // Check if jobs are already in queue (not done nor error)
        let genjobs = await db('genjobs').where({ userid: user.id() }).whereNotIn('status', ['done', 'error']);
        already += genjobs.length;

        if (already >= AVATAR_GEN_SIZE) console.log('Avatars already in GEN queue !');

        // build Genjob for each avatar
        for (let i = already; i < AVATAR_GEN_SIZE; i++) {
            let genjob = new Genjob();
            await genjob.new({ userid: user.id(), workflowid: 1, input: JSON.stringify({ pic: filename, seed: i }) });
            await genjob.status('pending');
        }

        // // add original pic
        // let avatar = new Avatar();
        // await avatar.new({ user_id: user.id(), url: '/upload/'+ path.basename(filename) });
        // avatars.push(avatar);

        // // complete with new avatars to reach AVATAR_GEN_SIZE
        // for (let i = avatars.length; i < AVATAR_GEN_SIZE; i++) {
        //     let avatar = new Avatar();
        //     await avatar.new({ user_id: user.id(), url: 'https://picsum.photos/1024/1024' });
        //     avatars.push(avatar);
        // }

        // return await Promise.all(avatars.map(a => a.get()));
    }
}

// Create Table if not exists
db.schema.hasTable('avatars').then((exists) => {
    if (!exists) {
        db.schema.createTable('avatars', (table) => {
            table.increments('id').primary();
            table.integer('user_id').notNullable();
            table.string('url').notNullable();
        }).then(() => {
            console.log('Table avatars created');
        });
    }
});

export default Avatar;