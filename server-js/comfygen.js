import { ComfyUIClient } from './network/cuicli.js';
import { env } from './core/env.js';
import fs from 'fs';
import { SOCKET } from './network/socket.js';
import db from './core/database.js';
import trophies from './trophies.js';
import { parse } from 'path';

const workflow = JSON.parse(fs.readFileSync('./server-js/config/workflow.json', 'utf8'))

let comfygen = {};

comfygen.serverAddress = env.COMFY_API_URL

comfygen.gen = async (avatarID, data, tribeID) => {

    const image_selfie = data.selfie[0];
    const image_paint = data.paint[0];

    const client = new ComfyUIClient(comfygen.serverAddress);
    await client.connect(); 
    
    const selfie_uploaded = await client.uploadImage(image_selfie.path, "selfie-"+avatarID+".png");
    const paint_uploaded = await client.uploadImage(image_paint.path, "paint-"+avatarID+".png");

    // console.log("-------------------- UPLOAD COMPLETED --------------------")
    // console.log(selfie_uploaded)

    const workflow_clone = structuredClone(workflow);
    
    const seed = Math.floor(Math.random() * 1000000);

    const tribeList = {
        1: 3,
        2: 1,
        3: 2
    }

    // Prompt seed
    workflow_clone["112"]["inputs"]["seed"] = seed;
    
    // Selfie
    workflow_clone["35"]["inputs"]["image"] = selfie_uploaded.name;
    
    // Dessin
    workflow_clone["11"]["inputs"]["image"] = paint_uploaded.name;

    // Tribe
    workflow_clone["83"]["inputs"]["value"] = tribeList[parseInt(tribeID)];

    const avatar = await db("avatars").where("id", avatarID).first();
    const user = await db("users").where("id", avatar.user_id).first();
    const userID = user.id;

    try {
        const result = await client.runPrompt(workflow_clone); // run

        const result_blob = result.outputs["21"][0].blob;

        const outputDir = 'gen_output';

        const filename = "static_"+avatarID+".png";
        await client.saveImage(result_blob, outputDir, filename);

        await client.disconnect();

        await db("avatars").where("id", avatarID).update({status: "done", filename: filename});
        SOCKET.toClient(userID, "comfygen_done", filename);
        
        trophies.reward(userID, 'avatar');

        return filename;
    } catch (error) {
        console.log("-------------------- COMFYGEN ERROR --------------------")
        console.log(error);
        await db("avatars").where("id", avatarID).update({status: "error"});
        SOCKET.toClient(userID, "update_avatar", "error");
        return false;
    }
}

comfygen.queue = [];

comfygen.newAvatar = async (userID) => {
    const avatarID = await db("avatars").insert({user_id: userID});
    await db("users").where("id", userID).update({selected_avatar: avatarID[0]});
    return avatarID[0];
}

comfygen.add = async (userID, data, tribeID) => {
    console.log("Adding AVATAR to queue");
    const avatarID = await comfygen.newAvatar(userID);
    comfygen.queue.push({avatarID, data, tribeID})
}

comfygen.sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

comfygen.start = async () => {
    const pending_avatars = await db("avatars").where("status", "pending").select("id", "user_id");
    for (const avatar of pending_avatars) {
        const userID = avatar.user_id;
        const avatarID = avatar.id;
        const data = await db("users").where("id", userID).first();

        if (avatarID != data.selected_avatar) {
            await db("avatars").where("id", avatarID).update({status: "error"});
            continue;
        }
        
        const tribeID = data.tribe_id;
        await comfygen.add(userID, data, tribeID);
    }
    comfygen.run();
}

comfygen.run = async () => {
    if (comfygen.queue.length > 0) {
        const { avatarID, data, tribeID } = comfygen.queue.shift();
        await comfygen.gen(avatarID, data, tribeID);
    } else {
        await comfygen.sleep(500);
    }
    comfygen.run();
}

export default comfygen