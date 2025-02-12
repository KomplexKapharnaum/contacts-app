import { app, server } from '../core/server.js';
import { Server as IoServer } from "socket.io";
import { env } from '../core/env.js';
import util from '../utils.js';
import police from '../core/police.js';
import db from '../core/database.js';

import stats from '../stats.js';
import trophies from '../trophies.js';

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
                if (count>=10*60) trophies.reward(userID, 'stay10');
            }, 10 * 1000)

            console.log("User connected: " + uuid);
        }
    });

    socket.on('event-live', (uuid) => {
        if (util.userExists(uuid)) {
            socket.join("event");
            socket.emit('start-event', SOCKET.lastEvent);
        }
    });

    socket.on('admin-auth', (password) => {
        console.log(password, env.ADMIN_PASS)
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
        
        const count = stats.addToUser(socket.userID, "messages_sent", 1);
        switch (count) {
          case 1: trophies.reward(socket.userID, 'msg1'); break;
          case 20: trophies.reward(socket.userID, 'msg20'); break;
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

    /* Avatar vote */

    socket.on("vote-avatar", async (userID) => {
      if (socket.rooms.has("user")) {
        stats.addToUser(userID, "avatar_score", 1)
      }
    })

    /* REGIE -> notification */
   
    socket.on('new-notification', async (data) => {
      if (!socket.rooms.has("admin")) return;
      const text = data.text;
      const color = data.color;
      await db.createNotification(text, color);
      socket.emit("notification-validation", true);
    });
});

export { SOCKET };