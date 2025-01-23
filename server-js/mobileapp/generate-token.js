const { GoogleAuth } = require('google-auth-library');

async function generateAccessToken() {
    const auth = new GoogleAuth({
        keyFile: '../contact-firebase-token.json', // Path to your service account file
        scopes: ['https://www.googleapis.com/auth/cloud-platform'], // Scope for FCM
    });

    const accessToken = await auth.getAccessToken();
    console.log('Access Token:', accessToken);
}

generateAccessToken().catch(console.error);

// ya29.c.c0ASRK0GaOsD6_R_IFB2JJBz06MQBK8GonEIbA9he9pwVf93ZP2Fp9s-exRlrHVXdYk7OH_Tex2rAC9vDJn8cakKcSvG58P2avp4X7XqhmBYQpUIE1lsMpThw7rNFAwibG71a6UwGM4CFZqzg057OPXzZvjbUgCi-AbVkd-Yd31AJKpNUR3Hyn6qMfQQVO0yQkywsmchV7o5AvScPt3RXei-E_SCIvRopGGLQNS0byoE5JZ7kDwvmZzdoY6g-t1ayjFQUQpFWu2qu18VNjPoAVv5wjkyIUFe7KR8ffqiKaFrNMgRsUXHkaEOM8xN4YxQdtruutO99ChjzpQ4yPXZjm2eoWuxV5O883a9ae_K9WWix39FcGnHSKoVDivgL387C9j6cQMriUhiicn2x0pXRyslawOjnai6i7Xn3VWtYmj82VqUsQ9XRbftmt11x27lkSr5fxkx8xRljWcbtUBrssxmtkY2SSMaenn-ZSRuqSdm2yMFRJ9MYVYl_gFXJVyteJuQ8mxRwRdY20I5ZS9j6M1-y0BXWBFp7igYUlbal7B3V1MmpV4OY0cRJnBXWqQ2119zv6mjbSU5MBfgBy3n7io-4cg-ek31U2eaumQu9kjWX0izZOVjysYp-dkV0O5krnfgI7sbbUzQ87II9e2bVqhkp-vwYkVYJsw9BlOryeRyYJrFz6JO51U1nsVInQslOW9629-w7Z4zJ1W0f8IV5Fs0mMkacOb08vOcWZs08fsXQUrM_1hj54oggBSZd7qbxss-59400fSQ9oW_J99z9r6t_mOgt3xny72Vsxgk_j2ntsXwItzpyf9ft6g-l6pkxcSXaVpdZfMcmjS1micr8BZe7bYmyY-f4wnoYhQt-oqMqmcJ9W9v4Jdoaqillvpucy5gBJQfBQ8WmOFJcap7aiu4zoY5oXyIvWIbYRjJSgs2IUv1lc2fhutVtaBvfb2xZRFRBcvzmWZX6Mkr9IY8sQq0dQqfcfyxkmXFQ7Bw5vYl8ydM17lXpwwy5