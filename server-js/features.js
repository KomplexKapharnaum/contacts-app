import db from './core/database.js'

let FEATURES = {};

/*
- App ouverte (inscriptions possible)
- Page tribu
  - Cri tribu
  - Mashup cri tribu
  - Vote avatars
- Page profil
  - Création avatar
  - Trophées
*/

FEATURES.config = [
    {
        name: "open_app",
        desc: "Application ouverte",
        default: true
    },
    {
        name: "tribe_page",
        desc: "Page tribu (+ rejoindre tribu)",
        default: true
    },
    {
        name: "tribe_cry",
        desc: "Cri tribu",
        default: false
    },
    {
        name: "tribe_cry_mashup",
        desc: "Voir mashup cri tribu",
        default: false
    },
    {
        name: "tribe_avatar_vote",
        desc: "Vote avatars",
        default: false
    },
    {
        name: "profile_page",
        desc: "Page profil",
        default: false
    },
    {
        name: "profile_avatar",
        desc: "Créer avatar",
        default: false
    },
    {
        name: "profile_stats",
        desc: "Trophées, stats et points",
        default: false
    },
    {
        name: "profile_description",
        desc: "Description du profile",
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