import db from './core/database.js'

let FEATURES = {};

FEATURES.config = {
    page_cyberspace: true,
    page_profile: false,
    page_tribe: false,
    create_avatars: false,
    vote_avatars: false,
    profile_description: false,
    join_tribe: false,
    tribe_cry: false
}

FEATURES.cache = {};

FEATURES.start = async () => {
    for (let key in FEATURES.config) {
        await new Promise((resolve, reject) => {
            db('features').where('name', key).first().then(async (row) => {
                if (!row) {
                    await FEATURES.add(key, FEATURES.config[key]);
                    resolve();
                }
            });
        })
    };

    db('features').select().then((rows) => {
        for (let row of rows) {
            FEATURES.cache[row.name] = row.enabled;
        }
    });
}

FEATURES.add = async (name, state=false) => {
    await db('features').insert({name, enabled: state});
    return true;
}

FEATURES.edit = async (name, state) => {
    state = (state === '1' || state === 1) ? true : (state === '0' || state === 0) ? false : state;
    await db('features').where('name', name).update({enabled: state});
    FEATURES.cache[name] = state;
}

FEATURES.getState = (name) => {
    return FEATURES.cache[name];
}

export default FEATURES;