import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import { app } from '../core/server.js';

function log(msg) {
    console.log(`[\x1b[32mNotifier\x1b[0m]\t${msg}`);
}

// Routes
app.post('/send-notification', async (req, res) => {
    const { fcmToken, title, body } = req.body;
    
    if (!fcmToken || !title || !body) {
        return res.status(400).send('Missing required fields');
    }
    
    try {
        const auth = new GoogleAuth({
            keyFile: 'generate-token.js',
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    
        const accessToken = await auth.getAccessToken();
    
        const response = await axios.post(
            `https://fcm.googleapis.com/v1/projects/84325436128/messages:send`,
            {
                message: {
                    token: fcmToken,
                    notification: {
                        title: title,
                        body: body,
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
    
        console.log('Notification sent:', response.data);
        res.status(200).send('Notification sent successfully!');
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Error sending notification');
    }
    });

log('ready.\n----------------------');
