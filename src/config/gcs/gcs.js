const { Storage } = require('@google-cloud/storage');

const keyJson = JSON.parse(
  Buffer.from(process.env.GOOGLE_BUCKET_KEY_BASE64, "base64").toString("utf8")
);


const storage = new Storage({ credentials: keyJson });
const bucket = storage.bucket(process.env.GOOGLE_BUCKET_NAME);

module.exports = bucket;