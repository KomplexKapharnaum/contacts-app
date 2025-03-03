import admin from 'firebase-admin';
import db from '../core/database.js';

const FIREBASE = {};

import serviceAccount from '../../firebase-sdk-admin.json' assert { type: 'json' };
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

FIREBASE.messagePayload = (title, body, topic=null, data={}) => ({
    notification: {
        title,
        body,
    },
    data,
    topic
});

FIREBASE.broadcastMessage = async (title, body, data={}) => {
    const message = FIREBASE.messagePayload(title, body, 'all', data);
    try {
        const res = await admin.messaging().send(message);
        console.log('Successfully sent message:', res);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

FIREBASE.toTribe = async (tribeID, title, body, data={}) => {
    const message = FIREBASE.messagePayload(title, body, 'tribe-'+tribeID, data);
    try {
        const res = await admin.messaging().send(message);
        console.log('Successfully sent message:', res);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

FIREBASE.toUser = async (userID, title, body, data={}) => {
    const user = await db('users').where('id', userID).first();
    if (!user) return false;
    const token = user.firebase_id;
    
    const payload = FIREBASE.messagePayload(title, body, null, data);

    try {
        const res = await admin.messaging().sendToDevice(token, payload);
        console.log('Successfully sent message:', res);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

export default FIREBASE