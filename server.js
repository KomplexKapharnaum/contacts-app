import express from 'express';

// HTTPS / HTTP
import http from 'http';
import https from 'https';

import { Server as IoServer } from "socket.io";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const BACKEND_PORT = process.env.BACKEND_PORT || 4000
const USE_HTTPS = process.env.USE_HTTPS && process.env.USE_HTTPS === 'true'

// Path
import path from 'path'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express
//
var app = express();
app.use(express.json({ limit: '50mb' }));

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

// Serve gitpull hook
//
app.post('/gitpull', function (req, res) {
  console.log('gitpull', req.body);
  res.send('OK');

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
