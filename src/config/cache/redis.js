const redis = require('redis');

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
    return await redisClient.get("opacubevip/" + key);
}

async function setCachedValue(key, ttlInSeconds, value) {
    await connectRedis();
    await redisClient.setEx("opacubevip/" + key, ttlInSeconds, value);
}

async function deleteCachedValue(key) {
    await connectRedis();
    await redisClient.del("opacubevip/" + key);
}

module.exports = {
    getCachedValue,
    setCachedValue,
    deleteCachedValue
};