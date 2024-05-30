// Knex db 
//

import knex from 'knex';

const db = knex({
    client: 'better-sqlite3',
    connection: {
        filename: './database/test.sqlite',
    },
    useNullAsDefault: true,
    });


export default db;