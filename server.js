import express from 'express';
import { exec, execSync } from 'child_process';
import sendSMS from './tools/sms_hico.js';
// import sendSMS from './tools/sms_ovh.js';

// MODELS / DB
import db from './tools/db.js';

// VERSION : get commit hash from git 
const VERSION = execSync('git rev-parse --short HEAD').toString().trim();

console.log("\n\n=====================================");
console.log("   =  CONTACTS SERVER v." + VERSION + " =");
console.log("=====================================\n\n");

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
await loadModel('Preset');

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
import { Console } from 'console';

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

SOCKET.lastEvent = {};

// Get all groups as array of names
async function getGroups() {
  const grp = new MODELS['Group']();
  const groups = await grp.list();
  const groupsArray = groups.map(group => group.name);
  return groupsArray;
}

getGroups().then((groups) => {
  groups.forEach((g) => {
    SOCKET.lastEvent[g] = false
  })
});

SOCKET.startEvent = function (name, args) {
  
  const group = args.params.grpChoice

  if (group != '') {
    // Update last event for a specific group
    SOCKET.lastEvent[group] = name=="end" ? false : {
      name: name,
      args: args,
      id: Math.floor(Math.random() * 1000000000)
    };
  } else {
    // Update last event for every groups
    for (const key in SOCKET.lastEvent) {
      SOCKET.lastEvent[key] = name=="end" ? false : {
        name: name,
        args: args,
        id: Math.floor(Math.random() * 1000000000)
      };
    }
  }

  SOCKET.io.emit('start-event', SOCKET.lastEvent);
};

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

let IS_EVENT_LIVE = false;

//  demarage server update all user !!!!!!!!!!!
SOCKET.io.on('connection', (socket) => {

  // Send initial HELLO trigger
  socket.emit('hello', VERSION);

  socket.on('identify', (uuid) => {

    socket.emit('getEventState', IS_EVENT_LIVE)

    // update user is_connected
    if (!uuid) return
    USER.isConnected({ uuid: uuid }, true)
      .then(() => {

        // store user info in socket
        socket.user_uuid = USER.fields.uuid
        socket.user_id = USER.fields.id
        console.log("user groups " + USER.fields.groups)

        db.select("*")
          .from("users_groups")
          .join("users", "users.id", "=", "users_groups.group_id")
          .join("groups", "groups.id", "=", "users_groups.group_id")
          .where("users.uuid", "=", uuid)
          .then((groupe) => {
            groupe.forEach((g) => {
              socket.join(g.id)
            })
          })
      })
      .catch((err) => {
        console.error('ERROR on SIO.identify', err);
      })
  })

  socket.on('disconnect', () => {

    // update user is_connected
    if (!socket.user_uuid) return
    USER.isConnected({ uuid: socket.user_uuid }, false)
      .then(() => {
        // leave room when disconect // FG
        db.select("*")
          .from("users_groups")
          .join("users", "users.id", "=", "users_groups.group_id")
          .join("groups", "groups.id", "=", "users_groups.group_id")
          .where("users.uuid", "=", uuid)
          .then((groupe) => {
            groupe.forEach((g) => {
              socket.leave(g.id)
            })
          })
      })
      .catch((err) => {
        console.error('ERROR on SIO.disconnect', err);
      })

  })

  // Image List
  socket.on('get-media-list', () => {
    fs.readdir('media', (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      let medias = files.filter(f => f.match(/\.(jpg|jpeg|png|gif|mp4|webm|ogg|mp3|wav|aac)$/i))
        .map(f => '/m/' + f);
      socket.emit('media-list', medias);
    });
  });

  // Partie de Maigre, je touche pas
  //

  // login admin
  socket.on('login', (password) => {
    if (!process.env.ADMIN_PASSWORD) console.warn('- WARNING - ADMIN_PASSWORD not set in .env file !');
    if (password === process.env.ADMIN_PASSWORD) {
      socket.emit('auth', 'ok');
      socket.join('admin');
      socket.emit("adminEventState", IS_EVENT_LIVE);

      console.log('admin connected');
    }
    else socket.emit('auth', 'failed');
  });

  // ctrl
  
  socket.on('ctrl', (data) => {
    
    if (!IS_EVENT_LIVE) return

    console.log('ctrl', data);
    if (!SOCKET.auth(socket)) return;   // check if admin
  
    if (data.name == "reload") SOCKET.io.emit('reload')
    else SOCKET.startEvent(data.name, data.args);

    const grp = data.args.params.grpChoice;
    SOCKET.io.emit("event-ok-" + data.resid, `${new Date().getHours()}:${new Date().getMinutes()} → ${data.name} event sent to @${grp===''?'everyone':grp.toLowerCase()}` );
  });

  socket.on('setEventState', (data) => {

    console.log('EVENT STATE HAS CHANGED : ', data);
    if (!SOCKET.auth(socket)) return;   // check if admin

    IS_EVENT_LIVE = data;
    SOCKET.io.emit('getEventState', IS_EVENT_LIVE);
  })

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
  // if (SOCKET.lastEvent) {
  //   socket.emit('start-event', SOCKET.lastEvent);
  // }

  socket.on('get-last-event', () => {
    socket.emit('start-event', SOCKET.lastEvent);
  })

  socket.on("sms", (msg, request) => {

    if (/\|/.test(request)) {
      request = request.replace(/\|/, '')
      console.log("requete : " + request)

      db('users').select().then((users) => {
        db.select("*")
          .from("users_sessions")
          .join('users', 'users.id', '=', 'users_sessions.user_id')
          .join('sessions', 'sessions.id', '=', 'users_sessions.session_id')
          .where({ "users_sessions.session_id": request })
          .then((phone) => {
            phone.forEach((p) => {
              console.log(p)
              sendSMS([p.phone], msg)
            })
          })
      })

      // @ balise de reco pour groupe
    } else if (/@/.test(request)) {
      request = request.replace(/@/, '')

      //  TODO FIX XML ERROR PARSING
      db.select("*")
        .from("users_groups")
        .join("users", "users_groups.group_id", "=", "groups.id")
        .join("groups", "groups.id", "=", "users_groups.group_id")
        .where({ "groups.id": request })
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
  socket.on("groupe_create", (s_id, g_name, g_desc) => {
    db('groups').insert({ name: g_name, description: g_desc, session_id: s_id }).then(
      db('groups').select().then((groupe) => {
        groupe.forEach((g) => {
          console.log([g.name])
        })
      })
    );
  })

  // insert msg
  socket.on("chat_msg", (message, session, group, checked) => {
    let time_stamp = Date.now()

    let verif_check = true
    // check group is null or exists !
    db.select("groups.id")
      .from("groups")
      .where({ id: group })
      .then((groups) => {
        if (groups.length > 0) {
          groups.forEach((g) => {
            console.log("groups : " + g.id)
          })
        } else if (!group || group == '') {
          group = null
          console.log("group_id is set to null")
        } else {
          verif_check = false
          console.log(verif_check)
          return (console.log("group not found"));
        }
      })

    // check session exists !
    db.select("sessions.id")
      .from("sessions")
      .where({ id: session })
      .then((res) => {
        if (res.length == 0) {
          verif_check = false
          console.log(verif_check)
          return (console.log("session not found"));
        }
      })

    // check message is not empty !
    if (message == '') {
      verif_check = false
      console.log(verif_check)
      return (console.log("message empty"))
    };

    setTimeout(() => {
      if (verif_check == true) {

        console.log(verif_check)
        db('Messages').insert({ message: message, emit_time: time_stamp, session_id: session, group_id: group }).then(
          console.log("msg send : " + message)
        );
        if (checked == true) 
        {
          db("users").select("is_connected", "phone").then((users) => {
            users.forEach((u) => {
              // if (u.is_connected == 0) {
                sendSMS([u.phone], "Vous avez reçu un nouveau message sur la webapp .::. contacts.kxkm.net")
              // }
            })
          })
          // db("users").select("is_connected", "phone").then((users) => {
          //   let phonelist = []
          //   users.forEach((u) => {
          //     if (u.is_connected == 0) phoneList.push(u.phone)
          //   })
          //   sendSMS(phonelist, "Nouveau message ! contacts.kxkm.net")
          // })

        }
        SOCKET.io.emit('new_chatMessage', message, time_stamp, group)
      }
    }
      , 200)
  })

  //set last read
  socket.on("last_read", (uuid) => {
    db('users').where({ uuid: uuid }).update({
      last_read: Date.now()
    }).then((res) => console.log(res)).catch((err) => console.log(err))
  })

  /* Livechat system */
  /* */

  socket.on("livechat-send", (uuid, msg, important) => {
    if (!uuid) return
    if (socket.user_uuid !== uuid) return

    db('users').where({ uuid: uuid }).then((user) => {
      user = user[0]
      let data = {
        username: user.name,
        date: Date.now(),
        msg: msg,
        public_id: user.public_id,
        important: important
      }
      chat_buffer.push(data)
      SOCKET.io.emit('livechat-get', data)
    });
  })

  socket.on("livechat-getall", () => {
    socket.emit('livechat-getall', chat_buffer)
  })

});

let chat_buffer = []

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
  // res.sendFile(__dirname + '/www/index.html');
  // redirect to app
  res.redirect('/app');
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

// Régie
app.use('/regie', express.static('www/regie'));

// img
app.use('/m', express.static('media'));
app.use('/media', express.static('www/media'));
app.get('/media', function (req, res) {
  res.sendFile(__dirname + '/www/media/list.html');
});

// AR tests
app.use('/ar', express.static('www/ar'));

// HOOKS
//
webhookHandler.on('*', function (event, repo, data) {
  // console.log('hook', event, repo, data);
  if (event === 'push') {
    // git stash then git pull && pm2 restart contacts
    console.log('processing push event (Pull / Restart)');
    exec('git pull && npm i && pm2 restart contacts', (err, stdout, stderr) => {
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
          console.error('Job error', job.fields.id, err);
        })
        .finally(() => {

          // check if there is still job to process for this user
          if (job.fields.id >= 0) 
          {
            USER.load({ id: job.fields.userid })
              .then(() => {
                if (USER.genjobs.length == 0) {
                  console.log('All jobs done for user', USER.fields.name);
                  // send notification to user
                  SOCKET.findID(USER.fields.id).then((client) => {
                    if (client) client.emit('reload');
                  })
                } 
              })
              .catch((err) => {})

          }

          processJobs();
        });
    })
}

processJobs();