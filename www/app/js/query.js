var QUERY = {};

QUERY.process = async (name, params) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(document.WEBAPP_URL+`/query?queryname=${name}&${queryString}`)
    const res = await response.json()
    return {
        status: response.status===200,
        data: res
    }
}

QUERY.createUser = async (name) => {
    const isNameValid = util.isUserNameValid(name);

    if (isNameValid[0]) {
        return await QUERY.process("create_user", {name: name});
    } else {
        return {error: isNameValid[1]};
    }
}

QUERY.getUser = async (uuid) => {
    return await QUERY.process("get_user", {uuid: uuid});
}

QUERY.getSession = async (uuid) => {
    return await QUERY.process("available_session", {uuid: uuid});
}

QUERY.subscribeToSession = async (uuid, sessionID) => {
    return await QUERY.process("session_subscribe", {uuid: uuid, session_id: sessionID});
}

QUERY.getEvents = async () => {
    if (!userData) return;
    return await QUERY.process("session_events", {
        uuid: userData.uuid
    });
}

QUERY.getEventLocation = async (eventID) => {
    if (!userData) return;
    return await QUERY.process("event_location", {
        event_id: eventID,
        uuid: userData.uuid
    });
}

QUERY.getMessages = async (tribeID) => {
    if (!userData) return;
    return await QUERY.process("get_messages", {
        uuid: userData.uuid,
        tribe_id: tribeID
    });
}

QUERY.admin = async (pass) => {
    await QUERY.process("admin", {
        uuid: userData.uuid, 
        pass: pass
    }).then(res => {
        if (res.status) {
            console.log(res.data);
        }
    });
}

QUERY.updateName = async (name) => {
    await QUERY.process("update_username", {
        uuid: userData.uuid, 
        name: name
    }).then(res => {
        if (res.status) {
            userData.name = name;
        }
    });
}

QUERY.getLeaderBoard = async () => {
    return await QUERY.process("leaderboard", {uuid: userData.uuid});
}

QUERY.getTribes = async () => {
    return await QUERY.process("tribelist")
}

QUERY.getNotifications = async () => {
    return await QUERY.process("notifications", {uuid: userData.uuid, tribe_id: userData.tribe_id});
}

QUERY.sendFeedback = async (message) => {
    return await QUERY.process("send_feedback", {uuid: userData.uuid, message: message});
}

QUERY.updateDescription = async (description) => {
    return await QUERY.process("update_description", {uuid: userData.uuid, description: description});
}

QUERY.getFeatures = async () => {
    return new Promise((resolve, reject) => {
        fetch(document.WEBAPP_URL+'/features')
            .then(res => res.json())
            .then(res => resolve(res))
    })
}

QUERY.setTribe = async (tribeID) => {
    return await QUERY.process("set_tribe", {uuid: userData.uuid, tribe_id: tribeID});
}

QUERY.getMashup = async () => {
    return await QUERY.process("tribe_mashup", {uuid: userData.uuid});
}