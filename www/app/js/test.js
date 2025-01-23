
function tlog(...msg) {
    console.log("%c[TEST]", "color: #0f0", ...msg);
}

async function testfetch(url) {
    return await new Promise((resolve, reject) => {
        fetch(url).then(res => res.json()).then(res => resolve(res)).catch(err => reject(err));
    })
}

async function app_test() {

    const username_valid = await testfetch(document.WEBAPP_URL+'/query?queryname=username_valid&name=TEST');
    tlog("username valid", username_valid);

    const create_user = await testfetch(document.WEBAPP_URL+'/query?queryname=create_user&name=TEST');    
    const uuid = create_user.uuid;
    tlog("created user with uuid", uuid);

    const update_username = await testfetch(document.WEBAPP_URL+'/query?queryname=update_username&uuid=' + uuid + '&name=TEST2');
    tlog("updated username", update_username.name);

    const get_user = await testfetch(document.WEBAPP_URL+'/query?queryname=get_user&uuid=' + uuid);
    tlog("get user", get_user);

    const available_session = await testfetch(document.WEBAPP_URL+'/query?queryname=available_session&uuid=' + uuid);
    tlog("available session", available_session);

    const session_subscribe = await testfetch(document.WEBAPP_URL+'/query?queryname=session_subscribe&uuid=' + uuid + '&session_id=' + available_session);
    tlog("subscribed to session", session_subscribe.session_id);

    const session_info = await testfetch(document.WEBAPP_URL+'/query?queryname=session_info&uuid=' + uuid);
    tlog("session info", session_info);

    const session_events = await testfetch(document.WEBAPP_URL+'/query?queryname=session_events&uuid=' + uuid);
    tlog("session events", session_events);

    const event_location = await testfetch(document.WEBAPP_URL+'/query?queryname=event_location&event_id=' + session_events[0].id + '&uuid=' + uuid);
    tlog("event location", event_location);
}