import { ComfyUIClient } from '../tools/cuicli.js';

// map 
Number.prototype.mapInt = function (in_min, in_max, out_min, out_max) {
    return Math.floor( (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min );
}

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
        // if (!input.avatar) input.avatar = ['blonde.png', 'native.png', 'pierre.png', 'punk.png'][Math.floor(Math.random() * 4)];
        // let avatarname = 'avatars/'+input.avatar;

        // select weirdness file
        let avFile = (input.weirdness).mapInt(0, 100, 1, 20) + input.increment;
        if (avFile > 20) avFile = (input.weirdness).mapInt(0, 100, 1, 20) - (avFile-20);
        if (avFile < 1) avFile = 1;
        avFile = avFile < 10 ? '0'+avFile : avFile;

        console.log('Selected avatar:', avFile);

        // set avatar pic
        prompt['3'].inputs.image = 'avatars/'+input.tribe+'/'+avFile+'.png'

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