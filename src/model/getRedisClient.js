const { createClient } = require("redis");

/**
 * creates redis client object
 * 
 * @param {Object} logger application logger
 * 
 * @returns {Object}
 */
function getRedisClient(logger) {
  const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    password: process.env.REDIS_PASSWORD,
    legacyMode: false,
  });

  client.on("error", err => logger.error(`Redis Client ${err}`));
  client.on("connect", () => logger.debug("Redis Connected"));
  client.on("end", () => logger.warning("Redis connection closed"));
  
  client.close = async _ => {
    if (client.isOpen) {
      await client.quit();
      return; 
    }
    client.disconnect();
  };
  
  client.connect()
  .then(() => logger.debug("Redis ready"))
  .catch((error) => {
    logger.error(`Redis connection error: ${error}`);
    process.exit(1);
  });

  return client;
}

module.exports = getRedisClient;