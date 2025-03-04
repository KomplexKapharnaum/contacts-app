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
            // insert feature if not exists
            db('features').select().where('name', key).then((rows) => {
                if (rows.length === 0) {
                    db('features').insert({name: key, enabled: FEATURES.config[key]}).then(() => {
                        FEATURES.cache[key] = FEATURES.config[key];
                        resolve();
                    });
                } else {
                    FEATURES.cache[key] = rows[0].enabled;
                    resolve();
                }
            });            
        })
    };
    console.log("Loaded features",FEATURES.cache);
}

FEATURES.add = async (name, state=false) => {
    return db('features').insert({name, enabled: state});
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