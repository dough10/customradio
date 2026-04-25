const {redisClient} = require('../services.js');

const WINDOW = 60 * 5;        // 5 minutes (seconds)
const BAN_DURATION = 60 * 60 * 24; // 24 hours
const MAX_ATTEMPTS = 3;

async function badActor(ip, attempts = MAX_ATTEMPTS) {
  const key = `customradio:rate:attempts:${ip}`;
  const banKey = `customradio:rate:ban:${ip}`;
  const now = Date.now();
  const windowStart = now - WINDOW * 1000;

  const isBanned = await redisClient.exists(banKey);
  if (isBanned) {
    await redisClient.expire(banKey, BAN_DURATION);
    return;
  }

  await redisClient.zAdd(key, [{ score: now, value: now.toString() }]);

  await redisClient.zRemRangeByScore(key, 0, windowStart);

  const count = await redisClient.zCard(key);

  await redisClient.expire(key, WINDOW);

  if (count > attempts) {
    await redisClient.set(banKey, "1", { EX: BAN_DURATION });
    await redisClient.del(key); 
  }
}

async function isBadActor(ip) {
  return (await redisClient.exists(`rate:ban:${ip}`)) === 1;
}

module.exports = { badActor, isBadActor };