import db from './core/database.js';

var util = {}

util.createUUID = () => {
    var d = new Date().getTime();
    var uuid = 'uuid-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

util.createPublicID = () => {
    var d = new Date().getTime();
    var id = 'xxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return id;
}

util.existingUsers = {};
util.userExists = async (uuid) => {
    if (util.existingUsers[uuid]) return true;
    const user = await db('users').where('uuid', uuid).first();
    if (user) util.existingUsers[uuid] = true;
    return user != undefined;
}

util.isAdmin = async (uuid) => {
    const user = await db('users').where('uuid', uuid).first();
    return user.admin;
}

util.isUserNameValid = function(username) {
    if (!username) return [false, 'username not valid']
    if (username.length < 3) return [false, 'Le pseudo doit contenir au moins 3 caractères']
    if (username.length > 20) return [false, 'Le pseudo doit contenir moins de 20 caractères']
    if (username.match(/[^a-zA-Z0-9_-]/)) return [false, 'Le pseudo ne doit contenir que des lettres, des chiffres, des tirets et des underscores']

    return [true, username]
}

export default util