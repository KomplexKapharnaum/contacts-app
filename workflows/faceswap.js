import { ComfyUIClient } from '../tools/cuicli.js';

// declare run function for import
export const run = 
    async (serverAddress, prompt, input) => 
    {   
        input = JSON.parse(input);
        console.log('Running faceswap workflow with input:', input );

        // randomise the codeformer weight
        // prompt['1'].inputs.codeformer_weight = Math.random(0, 0.1)

        // set user pic
        let picname = 'app/'+input.pic.split('/').pop().split('\\').pop();
        prompt['2'].inputs.image = picname;

        // set avatar pic
        if (!input.avatar) input.avatar = ['blonde.png', 'native.png', 'pierre.png', 'punk.png'][Math.floor(Math.random() * 4)];
        let avatarname = 'avatars/'+input.avatar;
        prompt['3'].inputs.image = avatarname;

        // Create client
        const client = new ComfyUIClient(serverAddress);

        // Connect to server
        await client.connect();

        // Upload images
        await client.uploadImage(input.pic, picname);

        // Wait for images
        const result = await client.runPrompt(prompt);
        // console.log('Result:', JSON.stringify(result, null, 2));

        const images = client.getImages(result);
        // console.log('Images:', images);

        // Save images to file
        const outputDir = 'outputs';
        await client.saveImages(images, outputDir);

        // console.log('Images saved to:', outputDir, images);

        // make array of filenames
        const filenames = Object.keys(images);

        // Disconnect
        await client.disconnect();

        return JSON.stringify(filenames);
    };