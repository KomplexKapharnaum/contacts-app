// Encrypt decrypt a string using a key fro .env

import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.CIPHER_KEY) throw new Error('CIPHER_KEY missing in .env i.e.: CIPHER_KEY='+crypto.randomBytes(32).toString('hex'))
if (!process.env.CIPHER_SALT) throw new Error('CIPHER_SALT missing in .env i.e.: CIPHER_SALT='+crypto.randomBytes(16).toString('hex'))

const algorithm = 'aes-256-cbc';
const key = crypto.createHash('sha256').update(String(process.env.CIPHER_KEY)).digest('base64').substr(0, 32);
const salt = crypto.createHash('sha256').update(String(process.env.CIPHER_SALT)).digest('base64').substr(0, 16);

var cipher = {
    encrypt: (text) => {
        let iv = salt;
        let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    },
    decrypt: (text) => {
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
};

export default cipher;