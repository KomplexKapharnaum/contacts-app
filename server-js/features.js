import db from './core/database.js'

let FEATURES = {};

FEATURES.config = [
    {
        name: "page_cyberspace",
        desc: "Ouverture page cyberespace",
        default: true
    },
    {
        name: "page_profile",
        desc: "Ouverture page profil",
        default: false
    },
    {
        name: "page_tribe",
        desc: "Ouverture page tribu (+ inscription tribu)",
        default: false
    },
    {
        name: "create_avatars",
        desc: "Création d'avatars",
        default: false
    },
    {
        name: "vote_avatars",
        desc: "Vote d'avatar",
        default: false
    },
    {
        name: "profile_description",
        desc: "Description de profil",
        default: false
    },
    {
        name: "tribe_cry",
        desc: "Cri de tribu (record & mashup)",
        default: false
    }
]

FEATURES.cache = {};

FEATURES.start = async () => {
    let featureslist = await db('features').select();
    console.log("Features list:", featureslist)
    
    for (let feature of FEATURES.config) {
        const name = feature.name;
        const description = feature.desc;
        const default_state = feature.default;

        if (featureslist.find(f => f.name === name)) {
            FEATURES.cache[name] = featureslist.find(f => f.name === name).enabled;
        } else {
            await db('features').insert({name, description, enabled: default_state});
            FEATURES.cache[name] = default_state;
        }
    }
    console.log("Loaded features", FEATURES.cache);
}

// FEATURES.add = async (name, state=false) => {
//     return db('features').insert({name, enabled: state});
// }

FEATURES.edit = async (name, state) => {
    state = (state === '1' || state === 1) ? true : (state === '0' || state === 0) ? false : state;
    await db('features').where('name', name).update({enabled: state});
    FEATURES.cache[name] = state;
    return state;
}

FEATURES.getState = (name) => {
    return FEATURES.cache[name];
}

export default FEATURES;