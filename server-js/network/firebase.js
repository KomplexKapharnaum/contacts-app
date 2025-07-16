import admin from 'firebase-admin';
import db from '../core/database.js';
import { env } from '../core/env.js';

const FIREBASE = {};

import serviceAccount from '../../firebase-sdk-admin.json' assert { type: 'json' };
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

FIREBASE.messagePayload = (title, body, topic=null, token=null) => ({
    // collapse key is the current date + hour (but not the minute)
    notification: {
        title: title,
        body: body,
    },
    // data,
    topic: topic,
});

FIREBASE.toDevicePayload = (title, body, token) => ({
    notification: {
        title: title,
        body: body,
    },
    token
})

FIREBASE.broadcastMessage = async (title, body, data={}) => {
    if (env.DISABLE_FIREBASE) return false;
    
    try {
        const message = FIREBASE.messagePayload(title, body, 'all', data); 
        console.log('FIREBASE: prep message:', message); 
        const res = await admin.messaging().send(message);
        console.log('FIREBASE: Successfully sent notification:', res);
    } catch (error) {
        console.warn('FIREBASE: Error sending notification:', error);
    }
}

FIREBASE.toTribe = async (tribeID, title, body, data={}) => {
    if (env.DISABLE_FIREBASE) return false;
    
    try {
        const message = FIREBASE.messagePayload(title, body, 'tribe-'+tribeID, data);
        const res = await admin.messaging().send(message);
        console.log('Successfully sent notification:', res);
    } catch (error) {
        console.warn('Error sending notification:', error);
    }
}

FIREBASE.toUser = async (userID, title, body, data={}) => {
    if (env.DISABLE_FIREBASE) return false;
    
    const user = await db('users').where('id', userID).first();
    if (!user) return false;
    const token = user.firebase_id;
    
    try {
        const message = FIREBASE.toDevicePayload(title, body, token);
        const res = await admin.messaging().send(message);
        console.log('Successfully sent notification:', res);
    } catch (error) {
        console.warn('Error sending notification:', error);
    }
}

export default FIREBASE