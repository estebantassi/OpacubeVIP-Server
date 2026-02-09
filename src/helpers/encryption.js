const crypto = require('crypto');

function Encrypt(valuetoencrypt, secret) {
    const KEY = Buffer.from(secret, 'hex');

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

    const encrypted = Buffer.concat([
        cipher.update(valuetoencrypt, 'utf8'),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function Decrypt(valuetodecrypt, secret) {
    const KEY = Buffer.from(secret, 'hex');

    const [ivHex, tagHex, encryptedHex] = valuetodecrypt.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}

module.exports = { Encrypt, Decrypt };