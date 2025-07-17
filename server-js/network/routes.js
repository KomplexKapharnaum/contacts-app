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
import { SOCKET } from './socket.js';

import dotenv from 'dotenv';
dotenv.config();

const tmpDir = process.env.TEMP_DIR || 'upload/_tmp';
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

const genDir = process.env.GEN_DIR || 'upload/gen_output';
if (!fs.existsSync(genDir)) {
    fs.mkdirSync(genDir, { recursive: true });
}

app.use('/static', express.static('www'));

app.set('trust proxy', 1 /* number of proxies between user and server */)
// app.get('/ip', (request, response) => response.send(request.ip)) => 'should client ip, otherwise increase trust proxy'

app.get('/', function (req, res) {
    res.redirect('/app');
});

// app.get('/restart', function (req, res) {
//     process.exit(1);
// });

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

// Admin routes
app.use('/admin', express.static('www/admin'));
app.use('/regie', express.static('www/regie'));
app.use('/regie2', express.static('www/regie_simple'));
app.use('/regiekxkm', express.static('www/regie_carnaval'));
app.use('/avatars', express.static(genDir));

// Mocap
app.use('/mocap', express.static('www/mocap'));
app.get('/mocap', function (req, res) {
    res.sendFile(path.join(__dirname, 'www/mocap/index.html'));
});

// Kpad
app.use('/kpad', express.static('www/kpad'));
app.get('/kpad', function (req, res) {
    res.sendFile(path.join(__dirname, 'www/kpad/index.html'));
});


// Kpad
app.use('/games', express.static('www/games'));

app.get('/features', function (req, res) {
    res.json(features.cache);
});

// Serve EXIT
app.get('/exit', function (req, res) {
    res.sendFile(__dirname + '/www/exit.html');
});

// Serve DOWNLOAD
app.get('/download', function (req, res) {
    res.sendFile(__dirname + '/www/download.html');
});

// Serve live feed page
app.use('/livefeed', express.static('www/livefeed'));

// Tribe cry upload
 
const upload = multer({ dest: tmpDir });

app.post('/tribe_audio_upload', upload.single('audio'), async function(req, res) {
    if (!features.getState("tribe_cry")) {
        res.status(400).send("Feature disabled");
        return;
    }

    const body = req.body;
    const uuid = body.uuid;
    const file = req.file;

    if (!file) {
        console.log("No audio file");
        res.status(400).send("No audio file");
        return;
    }

    if (await util.userExists(uuid) == false) {
        console.log("User not found");
        res.status(400).send("User not found");
        return;
    };

    const user = await db('users').where('uuid', uuid).first();
    if (!user) {
        console.log("User not found");
        res.status(400).send("User not found");
        return;
    }

    const tribeID = user.tribe_id;

    const audio_name = `${tribeID}-${user.id}.m4a`

    // Make sure the directory exists
    const uploadDir = path.join(__dirname, 'upload', 'cry_upload');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadPath = path.join(uploadDir, audio_name);

    // If the file already exists, delete it
    if (fs.existsSync(uploadPath)) {
        // fs.unlinkSync(uploadPath);
        // console.log("Deleted existing audio file");
        // rename existing file to a backup with timestamp
        const backupPath = path.join(uploadDir, `${tribeID}-${user.id}-${Date.now()}.m4a`);
        fs.renameSync(uploadPath, backupPath);
        console.log("Renamed existing audio file to backup");
    }

    fs.renameSync(file.path, uploadPath);
    console.log("Audio uploaded");

    await db('users').where('uuid', uuid).update({ audio: audio_name});

    res.status(200).send(audio_name);
});

app.use('/tribe_audio', express.static(path.join(__dirname, 'upload', 'cry_upload')));

app.post('/gen_avatar', upload.fields([{ name: 'selfie' }, { name: 'paint' }]), async function(req, res) {
    if (!features.getState("profile_avatar")) {
        res.status(400).send("Feature disabled");
        return;
    }

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
    comfygen.add(user.id, files, user.tribe_id);

    SOCKET.toClient(user.id, "update_avatar", "pending");

    res.status(200).send("Avatar saved");
});


app.use('/live_upload', express.static('upload/live_upload'));
app.post('/live_file_upload', upload.single('image'), async function(req, res) {
    const file = req.file;
    const uuid = req.body.uuid;
   
    if (!file) {
        return res.status(400).send("No image file");
    }
   
    if (await util.userExists(uuid) === false) {
        return res.status(400).send("User not found");
    }

    const file_extension = file.originalname.split('.').pop();
    const randomName = Array(16).fill(0).map(_ => Math.floor(Math.random() * 36).toString(36)).join('');
    const newFileName = `${randomName}.${file_extension}`;

    // Make sure the directory exists
    const uploadDir = path.join(__dirname, 'upload', 'live_upload');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, newFileName);
    
    // Fix: Use file.buffer if available, otherwise read from file.path
    if (file.buffer) {
        fs.writeFileSync(filepath, file.buffer);
    } else {
        // Copy the file from the temporary location to the target location
        fs.renameSync(file.path, filepath);
    }
    
    // Only try to unlink if file.path exists
    if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
    
    SOCKET.io.to("display").emit("live-file-uploaded", newFileName);
   
    res.status(200).send("File uploaded successfully");
});

app.use('/media', express.static(path.join(__dirname, 'media')));