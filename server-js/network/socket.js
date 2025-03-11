import { app, server } from '../core/server.js';
import { Server as IoServer } from "socket.io";
import { env } from '../core/env.js';
import util from '../utils.js';
import police from '../core/police.js';
import db from '../core/database.js';

import stats from '../stats.js';
import score from '../score.js';
import trophies from '../trophies.js';
import features from '../features.js'


import firebase from './firebase.js';
import rateLimiter from './ratelimiter.js';

var SOCKET = {};

SOCKET.io = new IoServer(server);

SOCKET.lastEvent = {0:{}};
SOCKET.startEvent = function (name, args) {

  const group = args.params.tribe

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


SOCKET.connectedUsers = {};

SOCKET.toClient = (userID, event, data) => {
    if (SOCKET.connectedUsers[userID]) {
        SOCKET.connectedUsers[userID].emit(event, data);
    }
}

var IS_EVENT_LIVE = false;
SOCKET.io.on('connection', (socket) => {
    socket.emit('hello');

    socket.on('disconnect', () => {
        if (SOCKET.connectedUsers[socket.userID]) delete SOCKET.connectedUsers[socket.userID];
        stats.save(socket.userID);
        trophies.save(socket.userID);

        clearInterval(socket.stayInterval);
    });

    socket.on('ping', () => {
        socket.emit('pong');
    });

    socket.on('user-auth', async (uuid) => {
        if (util.userExists(uuid)) {
            socket.join("user");
            socket.uuid = uuid;
            
            const user = await db('users').where('uuid', uuid).first();
            socket.userID = user.id;
            
            const tribe = user.tribe_id;
            if (tribe) socket.join("tribe-" + tribe);
            socket.tribeID = tribe;
            socket.public_id = user.public_id;
            socket.isAdmin = await util.isAdmin(uuid);

            const userID = user.id;
            SOCKET.connectedUsers[userID] = socket;

            stats.loadUser(user);
            trophies.loadUser(user);

            socket.stayInterval = setInterval(() => {
                const count = stats.addToUser(userID, "time_spent", 10);
                // console.log(count)

                if (count>=5*60) trophies.reward(userID, 'stay5');
                if (count>=15*60) trophies.reward(userID, 'stay15');
                if (count>=30*60) trophies.reward(userID, 'stay30');
                if (count>=60*60) trophies.reward(userID, 'stay60');

            }, 10 * 1000)

            console.log("User connected: " + uuid);

            trophies.reward(user.id, "join");
        }
    });

    socket.on('event-live', (data) => {
        const {uuid, join} = data;
        if (util.userExists(uuid)) {
          if (join) {
            socket.join("event");
            socket.emit('start-event', SOCKET.lastEvent);
          } else {
            socket.leave("event");
          }
        }
    });

    socket.on('admin-auth', (password) => {
        if (password == env.ADMIN_PASS) {
            console.log("Admin connected");
            socket.join("admin");
            socket.emit('getEventState', IS_EVENT_LIVE);
        }
    })

    socket.on('ctrl', (data) => {
      
      console.log('ctrl', data);
      if (!socket.rooms.has("admin")) return;

      if (data.name == "reload") SOCKET.io.emit('reload')
      else SOCKET.startEvent(data.name, data.args);

      const grp = data.args.params.grpChoice || '';
      SOCKET.io.emit("event-ok-" + data.resid, `${new Date().getHours()}:${new Date().getMinutes()} → ${data.name} event sent to @${grp===''?'everyone':grp.toLowerCase()}` );
    });

    socket.on('setEventState', (data) => {

      if (!socket.rooms.has("admin")) return;

      console.log('EVENT STATE HAS CHANGED : ', data);
      IS_EVENT_LIVE = data;
      SOCKET.io.emit('getEventState', IS_EVENT_LIVE);
    });

    /* === Chat === */

    socket.on("chat-message", async (data) => {
      if (socket.rooms.has("user")) {
        if (data.tribeID != socket.tribeID && data.tribeID != 0) return
        
        if (data.message.length > 500) return

        // Apply rate limiting
        const result = rateLimiter.isAllowed(socket.userID);
        if (!result.allowed) {
          socket.emit("rate-limited", result.timeRemaining);
          return;
        }

        const date = new Date()
        const id = await db.createMessage(socket.isAdmin, data.name, date, socket.uuid, socket.public_id, data.message, data.tribeID);
        Object.assign(data, {
          date, 
          admin: socket.isAdmin, 
          public_id: socket.public_id,
          id: id[0]
        });

        if (data.tribeID != 0) {
          SOCKET.io.to("tribe-" + data.tribeID).emit("chat-message", data);
        } else {
          SOCKET.io.to("user").emit("chat-message", data);
        }

        SOCKET.io.to("admin").emit("chat-message", data);
        
        const count = stats.addToUser(socket.userID, "messages_sent", 1);
        switch (count) {
          case 1: trophies.reward(socket.userID, 'msg1'); break;
          case 10: trophies.reward(socket.userID, 'msg10'); break;
          case 30: trophies.reward(socket.userID, 'msg30'); break;
        }
      }
    })

    socket.on("delete-message", async (messageID) => {
      if (socket.rooms.has("user")) {
        const msg = await db('messages').where({id: messageID}).first().then((row) => row)
        if (!msg) return
        if (msg.uuid == socket.uuid) {
          await db('messages').where({id: messageID}).delete();
          SOCKET.io.to("user").emit("delete-message", messageID);
        }
      }
    })

    socket.on("report-message", async(messageID) => {
      if (socket.rooms.has("user")) {
        const msg = await db('messages').where({id: messageID}).first().then((row) => row);
        if (!msg) return;
        
        const public_id = socket.public_id;
        const reports = JSON.parse(msg.reports);
        if (reports.includes(public_id)) return;

        const newList = [...reports, public_id];

        if (newList.length >= 3) {
            await db('messages').where({id: messageID}).update({deleted: true});
          SOCKET.io.to("user").emit("delete-message", messageID);
        } else {
          await db('messages').where({id: messageID}).update({reports: JSON.stringify(newList)});
          socket.emit("delete-message", messageID);
        }
      }
    });

    socket.on("live-question", async(data) => {
      const { question, answer } = data;
      if (socket.rooms.has("user")) {
        if (answer.length > 500) return;
        if (answer.length < 5) return;
        await db('live-answers').insert({
          user_id: socket.userID,
          question,
          answer,
          date: new Date().toISOString()
        });
      }
    })

    /* Avatar vote */

    socket.on("vote-avatar", async (data) => {
      const userID = socket.userID;
      const voted_userID = data.user_id;
      const voteState = data.vote;

      if (!features.getState("vote_avatars")) return;
      
      if (!stats.canVote(userID)) return [false, "user cannot vote"];
      if (stats.get(userID, "avatars_voted_today") >= 10) return [false, "user has already voted 10 avatars today"];

      stats.addToUser(userID, "avatars_voted_today", 1)
      stats.addToUser(userID, "avatars_voted", 1)

      if (voteState) {
        stats.addToUser(voted_userID, "avatar_score", 1)
        score.addToPlayer(voted_userID, 10);
      }
    })

    /* REGIE -> notification */
   
    // socket.on('new-notification', async (data) => {
    //   if (!socket.rooms.has("admin")) return;
    //   const text = data.text;
    //   const color = data.color;
    //   const addtochat = data.add_to_chat;
    //   const tribe = data.tribe;
    //   await db.createNotification(text, color);

    //   if (tribe!='') {
    //     firebase.toTribe(tribe, addtochat ? "Nouveau message" : "Notification", text);
    //   } else {
    //     firebase.broadcastMessage(addtochat ? "Nouveau message" : "Notification", text);
    //   }

    //   if (addtochat) {
    //     SOCKET.io.to("user").emit("chat-message", data);
    //     const id = await db.createMessage(true, "Notification", Date.now(), false, false, text, 0);
    //     const messageData = {
    //       date: Date.now(),
    //       admin: true,
    //       public_id: false,
    //       id: id[0]
    //     }
    //     SOCKET.io.to("user").emit("chat-message", messageData);
        
    //   }
    //   socket.emit("notification-validation", true);
    // });

    // socket.on("gen-avatar", async (data) => {
    //   if (!features.getState("vote_avatars")) return;
    //   if (!socket.rooms.has("user")) return;
    //   comfygen.add(socket.userID, data);
    // })

    /* Display */

    socket.on("display", async() => {
      socket.join("display");
    })
});

export { SOCKET };