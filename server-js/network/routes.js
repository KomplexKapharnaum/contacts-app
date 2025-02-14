import express from 'express';
import { app } from '../core/server.js';
import { query } from './query.js';
import { __dirname } from '../../path.js';
import path from "path";
import fs from "fs";
import police from '../core/police.js';

app.use('/static', express.static('www'));

app.get('/', function (req, res) {
    res.redirect('/app');
});

app.use('/static', express.static('www'));
app.use('/app', express.static(__dirname + '/www/app'));

// App web launcher (replace $BASEPATH$ with /app)
app.get('/app', function (req, res) {
    let html = fs.readFileSync(path.join(__dirname, 'www/app/app.html'), 'utf8');
    html = html.replace(/\$BASEPATH\$/g, '/app');
    res.send(html);
});

app.get('/query', async function (req, res) {
    const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const result = await query.request(req, params);
    res.status(result[0] ? 200 : 400).json(result[1]);
});

app.use('/regie', express.static('www/regie'));

app.use('/avatars', express.static('gen_output'));

// Serve EXIT
app.get('/exit', function (req, res) {
    res.sendFile(__dirname + '/www/exit.html');
});