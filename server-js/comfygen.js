import { ComfyUIClient } from './network/cuicli.js';
import { env } from './core/env.js';
import fs from 'fs';
import { SOCKET } from './network/socket.js';
import db from './core/database.js';

const workflow = JSON.parse(fs.readFileSync('./server-js/config/workflow.json', 'utf8'))

let comfygen = {};

comfygen.serverAddress = env.COMFY_API_URL

comfygen.gen = async (avatarID, data) => {

    const image_selfie = data.selfie[0];
    const image_paint = data.paint[0];

    const client = new ComfyUIClient(comfygen.serverAddress);
    await client.connect(); 
    
    const selfie_uploaded = await client.uploadImage(image_selfie.path, "selfie-"+avatarID+".png");
    await client.uploadImage(image_paint.path, "paint-"+avatarID+".png");

    // console.log("-------------------- UPLOAD COMPLETED --------------------")
    // console.log(selfie_uploaded)

    const workflow_clone = structuredClone(workflow);
    
    const seed = Math.floor(Math.random() * 1000000);

    workflow_clone["3"]["inputs"]["seed"] = seed;
    workflow_clone["10"]["inputs"]["image"] = selfie_uploaded.name;

    const result = await client.runPrompt(workflow_clone); // run
    const images = client.getImages(result, "static_"+avatarID);

    const outputDir = 'gen_output';

    await client.saveImages(images, outputDir);
    const filenames = Object.keys(images);

    await client.disconnect();

    const avatar = await db("avatars").where("id", avatarID).first();
    const user = await db("users").where("id", avatar.user_id).first();
    const userID = user.id;

    await db("avatars").where("id", avatarID).update({status: "done", filename: filenames[0]});
    await db("users").where("id", userID).update({selected_avatar: avatarID});
    SOCKET.toClient(userID, "comfygen_done", filenames[0]);

    return filenames[0];
}

comfygen.queue = [];

comfygen.newAvatar = async (userID) => {
    const avatarID = await db("avatars").insert({user_id: userID});
    return avatarID[0];
}

comfygen.add = async (userID, data) => {
    const avatarID = await comfygen.newAvatar(userID);
    comfygen.queue.push({avatarID, data})
}

comfygen.sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

comfygen.run = async () => {
    if (comfygen.queue.length > 0) {
        const { avatarID, data } = comfygen.queue.shift();
        await comfygen.gen(avatarID, data);
    } else {
        await comfygen.sleep(500);
    }
    comfygen.run();
}

export default comfygen