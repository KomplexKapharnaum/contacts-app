import { ComfyUIClient } from '../tools/cuicli.js';

// declare run function for import
export const run = 
    async (serverAddress, prompt, input) => 
    {
        // randomise the codeformer weight
        prompt['1'].inputs.codeformer_weight = Math.random(0, 0.1)

        // TODO: modify the prompt with the input !!

        // Create client
        const client = new ComfyUIClient(serverAddress);

        // Connect to server
        await client.connect();

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