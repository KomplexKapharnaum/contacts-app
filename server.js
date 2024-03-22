import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as IoServer } from "socket.io";
import fs from 'fs';
import { JSONFilePreset } from 'lowdb/node'
import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Global variables
const COG_API_URL = process.env.COG_API_URL || 'http://localhost:5000'
const COG_API_URL2 = process.env.COG_API_URL2 || 'http://localhost:5000'
const BACKEND_PORT = process.env.BACKEND_PORT || 4000
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:4000'

// import prompt_tree.json
const prompt_tree = JSON.parse(fs.readFileSync('prompt_tree.json', 'utf8'));


const upload_folder = "https://localhost:4000" // https://contacts.kxkm.net

// Path
import path from 'path'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database
const defaultData = { users: [{ nick: "Rasta1" }], requests: [] }
const db = await JSONFilePreset('database.json', defaultData)

// Servers
var app = express();
var server = HttpServer(app);
var io = new IoServer(server);


// Request AI
//
var cogBalance = 0
var requestAI = async function (reqid) {
  var request = db.data.requests.find((req) => req.uuid === reqid)
  if (request) {
    var raw = JSON.stringify(request.input)

    // Call POST request to API
    console.log(raw)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var COG
    if (cogBalance === 0) COG = COG_API_URL
    else COG = COG_API_URL2
    cogBalance = (cogBalance + 1) % 2
    console.log('=== COG endpoint', COG)

    const response = await fetch(`${COG}/predictions`, { method: 'POST', headers: myHeaders, body: raw, redirect: "follow" })
    try {
      const data = await response.json();
      return data
    }
    catch (err) {
      console.error('=== request error', response)
      throw new Error(err)
    }
  }
  throw new Error('Request not found');
}

var goAI = async function (reqid) {
  requestAI(reqid).then((res) => {
    console.log('=== request processed', reqid)
    console.log(res)

    // pick the request
    var request = db.data.requests.find((req) => req.uuid === reqid)

    // detect error
    if (res.error || !res.output) {
      request.status = "error"
      db.write()
      console.log('\tERROR: No output')
      console.log('\t', res.error)
      io.to(request.userid).emit('error', request, res)
      return
    }

    var request = db.data.requests.find((req) => req.uuid === reqid)

    // Save base64 result to outputs/
    for (var i = 0; i < res.output.length; i++) {
      var out = res.output[i];
      var outData = out.replace(/^data:image\/\w+;base64,/, "");
      var buf = Buffer.from(outData, 'base64');
      var filename = 'outputs/' + reqid + '_' + i + '.jpg';
      fs.writeFileSync(filename, buf);
      request.output.push(filename);
    }

    request.status = "done"
    db.write()
    console.log('done', reqid)
    io.to(request.userid).emit('done', request)
    for (var i = 0; i < request.output.length; i++) {
      io.emit('output', request.output[i])
    }
  })
    .catch((err) => {
      console.error('=== request error', reqid)
      console.error(err)
      var request = db.data.requests.find((req) => req.uuid === reqid)
      request.status = "error"
      db.write()
      io.to(request.userid).emit('error', request, err)
    })
}


// Socket.io 
//
io.on('connection', (socket) => {
  console.log('a user connected')

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })

  // Client is ready, tell him what to do
  socket.on('hi', (userid) => {
    // join userid room
    socket.join(userid)

    // check if nickname is set
    var user = db.data.users.find((user) => user.userid === userid)
    if (user) socket.emit('nickname', user.nick)

    // check if a request is pending
    var request = db.data.requests.filter((req) => req.userid === userid)
    if (request) socket.emit('generate', request)
  })

  // Get all outputs
  socket.on('outputs', () => {
    var outputs = fs.readdirSync('outputs')

    // randomize outputs
    outputs.sort(() => Math.random() - 0.5);

    for (var i = 0; i < outputs.length; i++) {
      socket.emit('output', "outputs/" + outputs[i])
    }
  })

  // Retry request
  socket.on('retry', (reqid) => {
    goAI(reqid)
  })

  // Send initial HELLO trigger
  socket.emit('hello');

});


// Express Server
//

server.listen(BACKEND_PORT, function () {
  console.log(`listening on *:${BACKEND_PORT}`);
});

app.use(express.json({ limit: '50mb' }));


//////////////////////

function findMatchingPrompt(data, prompt_tree) {
  delete data.anon;
  // fix temp paranoia cases are not really handled
  delete data.paranoia
  let filteredTree = prompt_tree;
  // filter out data values that are not in prompt_tree values
  filteredTree = prompt_tree.filter((prompt) => {
    return Object.keys(data).every((key) => {
      return prompt[key] === data[key];
    });
  });
  console.log("=========== findMatchingPrompt =========");
  console.log(filteredTree);
  return filteredTree[0] || prompt_tree[Math.floor(Math.random() * prompt_tree.length)];
}

//////////

app.post('/gen', function (req, res) {

  // Get JSON
  var data = req.body;
  console.log("=========== /gen REQUEST  =========");
  console.log(data); 

  const instant_id_strength = parseFloat(data?.prompts?.anon);
  console.log(instant_id_strength); // 1.5
  const match = findMatchingPrompt(data.prompts, prompt_tree);
  const prompt = match.prompt_txt;
  const modelname = match.file_name;

  // Save nick if not exists for uuid
  var user = db.data.users.find((user) => user.userid === data.userid)
  if (!user) {
    db.data.users.push({ userid: data.userid, nick: data.nick })
    db.write()
    console.log('==== new user nickname saved', data.userid)
  }

  // extract selfie base64 and save to uploads/
  var selfie = data.selfie;
  var selfieData = selfie.replace(/^data:image\/\w+;base64,/, "");
  var buf = Buffer.from(selfieData, 'base64');
  var filename = 'uploads/' + data.userid + '_' + Date.now() + '.jpg';
  fs.writeFileSync(filename, buf);
  data.selfie = filename;

  // New AI request
  var reqid = 'req_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  var inreq = {
    "input": {
      "image": BACKEND_BASE_URL + "/" + filename,
      "image_to_become": BACKEND_BASE_URL + "/models/" + modelname,
      "prompt": prompt,
      "negative_prompt": "",
      "number_of_images": 1,
      "denoising_strength": 1,
      "prompt_strength": 0.8,
      "control_depth_strength": 0.3,
      "instant_id_strength": instant_id_strength,
      "image_to_become_strength": 0.8,
      "image_to_become_noise": 0.53,
      "seed": 9,  // 194246477, // crypto.randomBytes(4).readUInt32BE(0, true)
      "disable_safety_checker": true
    }
  }
  console.log(inreq)
  var request = { uuid: reqid, userid: data.userid, data: data, input: inreq, output: [], status: "pending" };

  // Save the request to DB
  db.data.requests.push(request)
  db.write()

  // Query AI
  console.log('=== request AI', reqid)
  goAI(reqid)

  // Echo request 
  res.send(request);
});

app.get('/totem', function (req, res) {
  res.sendFile(__dirname + '/www/totem.html');
});

app.get('/reload', function (req, res) {
  io.emit('reload');
  res.send('reloaded');
});

app.get('/reload-totem', function (req, res) {
  io.emit('reload-totem');
  res.send('totem reloaded');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/www/app.html');
});

app.get('/old', function (req, res) {
  res.sendFile(__dirname + '/www/old/app.html');
});

// Serve static files /static
// app.use('/static', express.static('www'));
app.use('/static', express.static('www'));
app.use('/uploads', express.static('uploads'));
app.use('/models', express.static('models'));
app.use('/outputs', express.static('outputs'));