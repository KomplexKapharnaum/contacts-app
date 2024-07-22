// Knex db 
//

import dotenv from 'dotenv';
dotenv.config();

const DBFILE = process.env.DBFILE || 'test.sqlite';

import knex from 'knex';

const db = knex({
    client: 'better-sqlite3',
    connection: {
        filename: './database/'+DBFILE,
    },
    useNullAsDefault: true,
    });


export default db;