const redis = require('redis');

const appName = process.env.APPNAME;

const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
    console.error('Redis connection error: ', err);
});

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

async function getCachedValue(key) {
    await connectRedis();
    return await redisClient.get(appName + "/" + key);
}

async function setCachedValue(key, ttlInSeconds, value) {
    await connectRedis();
    await redisClient.setEx(appName + "/" + key, ttlInSeconds, value);
}

async function deleteCachedValue(key) {
    await connectRedis();
    await redisClient.del(appName + "/" + key);
}

module.exports = {
    getCachedValue,
    setCachedValue,
    deleteCachedValue
};