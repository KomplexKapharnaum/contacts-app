import express from 'express';
import { app } from '../core/server.js';
import { query } from './query.js';
import { __dirname } from '../../path.js';
import path from "path";
import fs from "fs";
import features from '../features.js';
import util from '../utils.js';
import db from '../core/database.js';
import police from '../core/police.js';

import bodyParser from 'body-parser';
import multer from 'multer';

import comfygen from '../comfygen.js';

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

app.get('/features', function (req, res) {
    res.json(features.cache);
});

// Serve EXIT
app.get('/exit', function (req, res) {
    res.sendFile(__dirname + '/www/exit.html');
});

// Tribe cry upload
 
const upload = multer({ dest: '_tmp/' });

app.post('/tribe_audio_upload', upload.single('audio'), async function(req, res) {
    
    const body = req.body;
    const uuid = body.uuid;

    const file = req.file;

    if (!file) {
        res.status(400).send("No audio file");
        return;
    }

    if (await util.userExists(uuid) == false) {
        res.status(400).send("User not found");
        return;
    };

    const user = await db('users').where('uuid', uuid).first();
    if (!user) {
        res.status(400).send("User not found");
        return;
    }

    const tribeID = user.tribe_id;

    const uploadPath = path.join(__dirname, 'cry_upload', `${tribeID}-${user.id}.mp3`);
    fs.renameSync(file.path, uploadPath);

    await db('users').where('uuid', uuid).update({ audio: `${tribeID}-${user.id}.mp3` });

    res.status(200).send("Audio uploaded");
});

app.post('/gen_avatar', upload.fields([{ name: 'selfie' }, { name: 'paint' }]), async function(req, res) {
    
    const files = req.files;
    const uuid = req.body.uuid;

    if (!uuid) {
        res.status(400).send("Missing uuid");
        return;
    }
    
    if (!files || !files.selfie || !files.paint) {
        res.status(400).send("Missing image files");
        return;
    }

    if (await util.userExists(uuid) == false) {
        res.status(400).send("User not found");
        return;
    };

    const user = await db('users').where('uuid', uuid).first();
    if (!user) {
        res.status(400).send("User not found");
        return;
    }
    comfygen.add(user.id, files);

    res.status(200).send("Avatar saved");
});
