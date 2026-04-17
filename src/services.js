require('dotenv').config();

const { WorkOS } = require('@workos-inc/node');
const { createClient } = require("redis");

const Stations = require('./model/Stations.js');
const UserData = require('./model/UserData.js');
const Alerts = require('./model/Alerts.js');
const Posts = require('./model/Posts.js');

const Logger = require('./util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const logger = new Logger(logLevel);

const DB_PATH = 'data/customradio.db';

const stations = new Stations(DB_PATH);
const userData = new UserData(DB_PATH);
const alerts = new Alerts(DB_PATH);
const posts = new Posts(DB_PATH);

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

/**
 * creates redis client object
 * 
 * @returns {Object}
 */
function redisClientFactory(url, pass) {
  const client = createClient({
    url: url || process.env.REDIS_URL || "redis://localhost:6379",
    password: pass || process.env.REDIS_PASSWORD || '',
    legacyMode: false,
  });
  
  client.connect()
  .then(() => logger.debug("Redis ready"))
  .catch((error) => {
    logger.error(`Redis connection error: ${error}`);
    process.exit(1);
  });
  
  client.on("error", err => logger.error(`Redis Client ${err}`));
  client.on("connect", () => logger.debug("Redis Connected"));
  client.on("end", () => logger.warning("Redis connection closed"));

  client.close = async _ => {
    if (client.isOpen) return await client.quit();
    client.disconnect();
  };

  return client;
}

const redisClient = redisClientFactory();

/**
 * application shutdown callback
 * 
 * @returns {void}
 */
async function shutdown() {
  try {
    logger.debug("Shutting down...");
    if (redisClient.isOpen) await redisClient.close();
  } catch (err) {
    logger.error(`Error during shutdown: ${err}`);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = {
  stations,
  userData,
  alerts,
  posts,
  logger,
  redisClient,
  logLevel,
  workos
}