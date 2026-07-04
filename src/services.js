require('dotenv').config();

const { injectSecrets } = require('./config/secrets.js');

injectSecrets([
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'REDIS_PASSWORD',
  'MONGODB_URL'
]);

const { WorkOS } = require('@workos-inc/node');

const Stations = require('./model/Stations.js');
const UserData = require('./model/UserData.js');
const Alerts = require('./model/Alerts.js');
const Posts = require('./model/Posts.js');
const Mongo = require('./model/Mongo.js');

const getRedisClient = require('./model/getRedisClient.js');

const Logger = require('./util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const logger = new Logger(logLevel);

const DB_PATH = 'data/customradio.db';

const stations = new Stations(DB_PATH);
const userData = new UserData(DB_PATH);
const alerts = new Alerts(DB_PATH);
const posts = new Posts(DB_PATH);
const mongo = new Mongo(process.env.MONGODB_URL, "radiotxt", logger);

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

const redisClient = getRedisClient(logger);

/**
 * application shutdown callback
 * 
 * @returns {void}
 */
async function shutdown() {
  try {
    logger.debug("Shutting down...");
    await redisClient.close();
    await mongo.close();
    process.exit(0);
  } catch (err) {
    logger.error(`Error during shutdown: ${err}`);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = {
  stations,
  userData,
  alerts,
  posts,
  mongo,
  logger,
  redisClient,
  logLevel,
  workos
}