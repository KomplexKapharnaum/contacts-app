import express from 'express';
import { exec } from 'child_process';

// MODELS / DB
import db from './db.js';

var MODELS = {};
function loadModel(name) {
  // load model default using import
  let model = import('./models/' + name.toLowerCase() + '.js');
  model.then((m) => {
    MODELS[name] = m.default;
  })
}

loadModel('Session');

// HTTPS / HTTP
import http from 'http';
import https from 'https';

import { Server as IoServer } from "socket.io";
import webPush from "web-push";

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
let SOCKET = {};

SOCKET.io = new IoServer(server);;

SOCKET.lastEvent = false;

SOCKET.startEvent = function (name, args) {
  SOCKET.lastEvent = {
    name: name,
    args: args
  };
  SOCKET.io.emit('start-event', SOCKET.lastEvent);
};

SOCKET.endEvent = function () {
  SOCKET.lastEvent = false;
  SOCKET.io.emit('end-event');
}

SOCKET.auth = function (socket) {
  if (!socket.rooms.has('admin')) {
    socket.emit('auth', 'failed');
    return false;
  }
  return true;
}

function isEventActive() {
  return false;
}

let accounts = {
  "0783115016" : {
    pseudo: false,
    images: []
  }
}

app.get('/phone', function (req, res) {
  console.log('phone', req.query.phone)
  const phone = req.query.phone;
  console.log('phone', phone)
  if (accounts[phone]) res.send(true);
  else res.send(false);
});

SOCKET.io.on('connection', (socket) => {
  // console.log('a user connected')

  socket.on('disconnect', () => {
    // console.log('user disconnected')
  })

  // Send initial HELLO trigger
  socket.emit('hello');

  socket.on('register', (data) => {
    let phone = data.phone;
    if (accounts[phone]) {
      socket.emit('register', false);
      return;
    };
    accounts[phone] = {
      pseudo: data.pseudo,
      images: []
    }
    socket.emit('register', phone);
  });

  socket.on('auth', (token) => {
    if (accounts[token]) socket.emit('auth', accounts[token]);
    else socket.emit('auth', false);
  });

  socket.on('event?', () => {
    socket.emit("event?", isEventActive());
  });

  // Partie de Maigre, je touche pas
  //

  // login
  socket.on('login', (password) => {
    if (!process.env.ADMIN_PASSWORD) console.warn('- WARNING - ADMIN_PASSWORD not set in .env file !');
    if (password === process.env.ADMIN_PASSWORD) {
      socket.emit('auth', 'ok');
      socket.join('admin');

      console.log('admin connected');
    }
    else socket.emit('auth', 'failed');
  });

  // ctrl-do
  socket.on('ctrl-do', (data) => {

    console.log('ctrl-do', data);
    if (!SOCKET.auth(socket)) return;   // check if admin

    if (data.name == "end") SOCKET.endEvent();
    else SOCKET.startEvent(data.name, data.args);

  });

  // db-do
  socket.on('db-do', (data) => {

    console.log('db-do', data);
    if (!SOCKET.auth(socket)) return;   // check if admin

    let model = data.name.split('.')[0]
    let action = data.name.split('.')[1]

    // Check if Model Class exists
    if (MODELS[model] === undefined) {
      console.error('Model not found', model);
      SOCKET.io.emit('log', 'Model not found ' + model);
      return;
    }

    // Load object model
    let m = new MODELS[model]();

    // Check if Method exists
    if (m[action] === undefined) {
      console.log(m)
      console.error('Action not found ' + model + '.' + action);
      SOCKET.io.emit('log', 'Action not found ' + model + '.' + action);
      return;
    }
    
    m[action](data.args)
      .then((answer) => {
          if (data.uuid) SOCKET.io.emit('ok-'+data.uuid, "BOZ")  // send response to client Promise
          if (answer === undefined) SOCKET.io.emit('log', model + '.' + action + '(' + data.args + ') \tOK')
      })
      .catch((err) => {
        if (data.uuid) SOCKET.io.emit('ko-'+data.uuid, err.message)  // send response to client Promise
        SOCKET.io.emit('log', model + '.' + action + '(' + data.args + ') \tERROR : ' + err.message)
        console.error(err);
      })
  });

  // db-get
  socket.on('db-get', (data) => {

    console.log('db-get', data);
    if (!SOCKET.auth(socket)) return;   // check if admin

    // session-list
    if (data.name == "Session.list")
      db('sessions').select().then((sessions) => {
        socket.emit('Session.list', sessions);
      });  

  });

  // last event
  if (SOCKET.lastEvent) {
    socket.emit('start-event', SOCKET.lastEvent);
  }

  socket.on('uuid', (uuid) => {
    console.log('received uuid', uuid);
  })

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

app.use('/app', express.static('www/app'));
app.get('/app', function (req, res) {
  res.sendFile(__dirname + '/www/app/app.html');
});

// Serve PWA
app.get('/pwa', function (req, res) {
  res.sendFile(__dirname + '/www/pwa/app.html');
});

app.get('/pwa/admin', function (req, res) {
  res.sendFile(__dirname + '/www/pwa/admin/admin.html');
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
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env file. " +
      "You can use the following ones:",
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
});

app.post(`/sub`, async (req, res) => {
  const subscription = req.body;
  console.log(subscription);
  // Subscribe with the new application server key
  sendNotif(
    subscription,
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