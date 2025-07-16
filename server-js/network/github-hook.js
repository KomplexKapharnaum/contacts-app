import { exec } from 'child_process';
import { app } from '../core/server.js';

// Load environment variables from .env file
// const dotenv = require('dotenv');
import dotenv from 'dotenv';
dotenv.config();

const GITHOOK_SECRET = process.env.GITHOOK_SECRET || 'secret'

function log(msg) {
  console.log(`[\x1b[33mWebhook\x1b[0m]\t${msg}`);
}


// import GithubWebHook from 'express-github-webhook';
// const GithubWebHook = require('express-github-webhook');
// const bodyParser = require('body-parser');
import GithubWebHook from 'express-github-webhook';
import bodyParser from 'body-parser';
var webhookHandler = GithubWebHook({ path: '/webhook', secret: GITHOOK_SECRET });

// HOOKS
webhookHandler.on('*', function (event, repo, data) {
    // log('hook', event, repo, data);
    if (event === 'push') {
      log('processing push event (Pull / Restart)');

      // cd to the project directory and run git pull and npm install
      exec(`cd ${process.cwd()} && git pull && npm install`, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return; 
        }
        log(stdout);
        process.exit();
      });
    }
  });


// Middlewares
app.use(bodyParser.json());
app.use(webhookHandler);

log('ready.\n----------------------');
