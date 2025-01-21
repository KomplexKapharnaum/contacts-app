// Imported libraries
// 
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
// import https from 'https';

import { env } from './env.js';
var app = express();
app.use(bodyParser.json());
app.use(express.json({ limit: '50mb' }));

var server = http.createServer(app);
server.listen(env.BACKEND_PORT, console.log("listening on http://*:" + env.BACKEND_PORT));

export { app, server };