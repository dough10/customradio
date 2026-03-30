const {logger, redisClient, workos} = require('./../services.js');

module.exports = async function getWorkOSUser(userId) {
  const cacheKey = `workos:${userId}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await workos.userManagement.getUser(userId);

    await redisClient.set(cacheKey, JSON.stringify(user), {
      EX: 60 * 10,
    });

    return user;

  } catch (err) {
    logger.warn('WorkOS getUser failed, falling back to cache:', err.message);

    const stale = await redisClient.get(cacheKey);
    if (stale) {
      return JSON.parse(stale);
    }

    throw err;
  }
}