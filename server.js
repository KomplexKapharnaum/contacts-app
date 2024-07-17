import express from 'express';
import { exec } from 'child_process';
import sendSMS from './tools/sms_test.js';

// MODELS / DB
import db from './tools/db.js';

var MODELS = {};
async function loadModel(name) {
  // load model default using import
  let model = await import('./models/' + name.toLowerCase() + '.js');
  MODELS[name] = model.default;
}

await loadModel('Session');
await loadModel('Event');
await loadModel('User');
await loadModel('Avatar');
await loadModel('Genjob');
await loadModel('Group');
await loadModel('Message');

// MODELS HANDLER
var GENJOB = new MODELS['Genjob']()
var USER = new MODELS['User']()

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

SOCKET.findUUID = async function (uuid) {
  let clients = await SOCKET.io.fetchSockets()
  let client = clients.find(c => c.user_uuid === uuid)
  return client
}

SOCKET.findID = async function (id) {
  let clients = await SOCKET.io.fetchSockets()
  let client = clients.find(c => c.user_id === id)
  return client
}

//  demarage server update all user !!!!!!!!!!!
SOCKET.io.on('connection', (socket) => {

  // Send initial HELLO trigger
  socket.emit('hello');

  socket.on('identify', (uuid) => {
    
    // update user is_connected
    USER.isConnected({ uuid: uuid }, true)

    // store user info in socket
    socket.user_uuid = USER.fields.uuid
    socket.user_id = USER.fields.id

    // join ( or create ) room on session name and groupe name // FG
    db.select("groups.name")
      .from("groups")
      .join("users", "users.groupe_id", "=", "groups.id")
      .where("users.uuid", "=", uuid)
      .then((groupe) =>{
        groupe.forEach((g)=>{
          db.select("sessions.name")
          .from("sessions")
          .join("groups", "groups.session_id", "=", "sessions.id")
          .where("groups.name", "=", g.name)
          .then((s) =>{
            socket.join(s.name+"@"+g.name)
          })
        })
      })
  })

  socket.on('disconnect', () => {
    if (socket.user_uuid) {

      // update user is_connected
      USER.isConnected({ uuid: uuid }, false)

      // leave room when disconect // FG
      db.select("groups.name")
      .from("groups")
      .join("users", "users.groupe_id", "=", "groups.id")
      .where("users.uuid", "=", socket.user_uuid)
      .then((groupe) =>{
        groupe.forEach((g)=>{
          db.select("sessions.name")
          .from("sessions")
          .join("groups", "groups.session_id", "=", "sessions.id")
          .where("groups.name", "=", g.name)
          .then((s) =>{
            socket.leave(s.name+"@"+g.name)
          })
        })
      })
    }
  })


  // Partie de Maigre, je touche pas
  //

  // login admin
  socket.on('login', (password) => {
    if (!process.env.ADMIN_PASSWORD) console.warn('- WARNING - ADMIN_PASSWORD not set in .env file !');
    if (password === process.env.ADMIN_PASSWORD) {
      socket.emit('auth', 'ok');
      socket.join('admin');

      console.log('admin connected');
    }
    else socket.emit('auth', 'failed');
  });

  // ctrl
  socket.on('ctrl', (data) => {

    console.log('ctrl', data);
    if (!SOCKET.auth(socket)) return;   // check if admin

    if (data.name == "end") SOCKET.endEvent();
    else SOCKET.startEvent(data.name, data.args);

  });

  // query
  socket.on('query', (data) => {

    // if (!SOCKET.auth(socket)) {
    //   console.log('unauthorized query', data);
    //   return;   // check if admin
    // }
    console.log('query', data);

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

    // marke args a list if not already
    if (!Array.isArray(data.args)) data.args = [data.args]

    // Call method and send response to client
    m[action](...data.args)
      .then((answer) => {
        // console.log('answer', answer)
        if (data.resid) SOCKET.io.emit('ok-' + data.resid, answer)  // send response to client Promise
        if (answer === undefined) SOCKET.io.emit('log', model + '.' + action + '(' + JSON.stringify(data.args) + ') \tOK')
      })
      .catch((err) => {
        if (data.resid) SOCKET.io.emit('ko-' + data.resid, err.message)  // send response to client Promise
        SOCKET.io.emit('log', model + '.' + action + '(' + data.args + ') \tERROR : ' + err.message)
        console.error(err);
      })
  });

  // last event
  if (SOCKET.lastEvent) {
    socket.emit('start-event', SOCKET.lastEvent);
  }

  socket.on("sms", (msg, request) => {

    if (/\|/.test(request)) {
      request = request.replace(/\|/, '')
      console.log("requete : " + request)

      db('users').select().then((users) => {
        db.select("phone")
          .from("users")
          .join('users_sessions', 'users.id', '=', 'user_sessions.user_id')
          .where({ "users_sessions.session_id": request })
          .then((phone) => {
            phone.forEach((p) => {
              console.log(p)
              sendSMS([p], msg)
            })
          })
      })

      // @ balise de reco pour groupe
    } else if (/@/.test(request)) {
      /////////////// SET GROUP FOR USER => DELETE WHEN FRONT READY
      db('users').where({ id: 1 }).update({
        groupe_id: 1,
      }).then((res) => console.log(res)).catch((err) => console.log(err))
      ///////////////
      request = request.replace(/@/, '')
      db.select("phone")
        .from("users")
        .where({ "groupe_id": request })
        .then((users) => {
          users.forEach((u) => {
            console.log(u.phone)
            sendSMS([u.phone], msg)
          })
        })
    } else {
      sendSMS([request], msg)
    }
  })

  //groupe create
  socket.on("groupe_create", (s_id, g_name, u_id, g_desc) => {
    db('groups').insert({ name: g_name, description: g_desc, user_id: u_id, session_id: s_id }).then(
      db('groups').select().then((groupe) => {
        groupe.forEach((g) => {
          console.log([g.name])
        })
      })
    );
  })

  // insert msg
  socket.on("chat_msg", (message, session, checked) => {
    let time_stamp = Date.now()
    db('Messages').insert({ message: message, emit_time: time_stamp, session_id: session }).then();
    if (checked == true) {
      db("users").select("is_connected", "phone").then((users) => {
        users.forEach((u) => {
          if (u.is_connected == 0) {
            sendSMS([u.phone], "contacts.kxkm.net")
          }
        })
      })
    }
    SOCKET.io.emit('new_chatMessage', message)
  })

  //set last read
  socket.on("last_read", (uuid) =>{
    db('users').where({ id: 1 }).update({
      last_read: Date.now()
    }).then((res) => console.log(res)).catch((err) => console.log(err))
  })

  ///////////////////// delete quand finit
  socket.on("addU", (u) => {
    db("users").insert({
      name: "userTest",
      phone: "0674287959",
      uuid: "TEST",
      is_connected: 0
    }).then()
  })
  ///////////////////////

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
app.use('/upload', express.static('upload'));
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

app.use('/pwa', express.static('www/pwa'));

// Admin
app.get('/admin', function (req, res) {
  res.sendFile(__dirname + '/www/admin/admin.html');
});

app.get('/admin/sms', function (req, res) {
  res.sendFile(__dirname + '/www/admin/sms_form.html');
});

app.get('/app/msg', function (req, res) {
  res.sendFile(__dirname + '/www/app/msg_box.html');
});

///////////////////////// TODELETE
app.get('/app/addU', function (req, res) {
  res.sendFile(__dirname + '/www/app/add_user_TODELETE.html');
});
/////////////////////////

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

// JOBS Processing : 
//
function processJobs() {
  // Get next job (pending status, older date first)
  GENJOB.next()
    .then((job) => {
        job.run()
          .then(() => {
            // if (job.fields.id >= 0) console.log('Job done', job.fields.id);
          })
          .catch((err) => {
            // console.error('Job error', job.fields.id, err);
          })
          .finally(() => {
            
            // check if there is still job to process for this user
            if (job.fields.id >= 0) 
            {
              USER.load({ id: job.fields.user_id }).then(() => {
                if (USER.genjobs.length == 0) {
                  console.log('All jobs done for user', USER.fields.name);
                  // send notification to user
                  SOCKET.findID(USER.fields.id).then((client) => {
                    if (client) client.emit('reload');
                  })
                } 
              })
  
  
              SOCKET.findID(job.fields.user_id).then((client) => {
                if (client) client.emit('job', job.get());
              })
            }

            processJobs();
          });
    })
}

processJobs();

