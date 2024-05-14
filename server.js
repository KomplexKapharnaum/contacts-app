import express from 'express';
import { exec } from 'child_process';

// HTTPS / HTTP
import http from 'http';
import https from 'https';

import { Server as IoServer } from "socket.io";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const BACKEND_PORT = process.env.BACKEND_PORT || 4000
const USE_HTTPS = process.env.USE_HTTPS && process.env.USE_HTTPS === 'true'
const GITHOOK_SECRET = process.env.GITHOOK_SECRET || 'secret'  

// Path
import path from 'path'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hooks
import GithubWebHook from 'express-github-webhook';
var webhookHandler = GithubWebHook({ path: '/webhook', secret: GITHOOK_SECRET });

// Express
//
import bodyParser from 'body-parser';
var app = express();
app.use(bodyParser.json());
app.use(webhookHandler);

// HTTPS / HTTP
if (USE_HTTPS) {
  const options = { 
    key: fs.readFileSync('certs/server.key'), 
    cert: fs.readFileSync('certs/server.cert') 
  };
  var server = https.createServer(options, app);
} 
else var server = http.createServer(app);

// Socket.io
//
var io = new IoServer(server);

io.on('connection', (socket) => {
  console.log('a user connected')

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })

  // Send initial HELLO trigger
  socket.emit('hello');
});


// Express Server
//

server.listen(BACKEND_PORT, function () {
  var txt = 'listening on http'
  if (USE_HTTPS) txt += 's'
  txt += '://*:' + BACKEND_PORT;
  console.log(txt);
});

app.use(express.json({ limit: '50mb' }));

// Serve index.html
//
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/www/index.html');
});



// Serve static files /static
// app.use('/static', express.static('www'));
app.use('/static', express.static('www'));
app.use('/uploads', express.static('uploads'));
app.use('/models', express.static('models'));
app.use('/outputs', express.static('outputs'));

// Serve PWA
app.get('/pwa', function (req, res) {
  res.sendFile(__dirname + '/www/pwa/app.html');
});

app.use('/pwa', express.static('www/pwa'));

// HOOKS
//
webhookHandler.on('*', function (event, repo, data) {
    // console.log('hook', event, repo, data);
    if (event === 'push') {
        // git stash then git pull && pm2 restart contacts
        console.log('processing push event (stash / Pull / Restart)');
        exec('git stash && git pull && npm i && pm2 restart contacts', (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
        });        
    }
});

// Web Push
import webPush from "web-push";

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
      "environment variables. You can use the following ones:",
  );
  const { publicKey, privateKey } = webPush.generateVAPIDKeys()

  process.env.VAPID_PUBLIC_KEY = publicKey;
  process.env.VAPID_PRIVATE_KEY = privateKey;

  console.log('VAPID_PUBLIC_KEY:', publicKey);
  console.log('VAPID_PRIVATE_KEY:', privateKey);
}

webPush.setVapidDetails(
  "https://contacts.kxkm.net",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

app.get(`/vapidPublicKey`, (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
  sendNotif(
    {
      endpoint: req.query.endpoint,
      keys: {
        auth: req.query.auth,
        p256dh: req.query.p256dh,
      },
    },
    "Hello from the server",
    60,
    0,
  );
});

app.get(`/subscribe`, (req, res) => {
  sendNotif(
    JSON.parse(req.query.subscription),
    "Hello from the server",
    60,
    10,
  );
  res.send("done");
});

function sendNotif(subscription, payload, ttl, delay) {
  const options = {
    TTL: ttl,
  };

  setTimeout(() => {
    webPush
      .sendNotification(subscription, payload, options)
      .then(() => {
        console.log("Push sent");
      })
      .catch((error) => {
        console.log(error);
      });
  }, delay * 1000);
}