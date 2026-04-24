require('dotenv').config();

const { injectSecrets } = require('./config/secrets.js');

injectSecrets([
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'REDIS_PASSWORD',
  'MONGODB_URL'
]);

const { WorkOS } = require('@workos-inc/node');
const { createClient } = require("redis");
const { MongoClient } = require("mongodb");

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

let mongoClient;
let db;
const mongo = {};

/**
 * Initalize mongodb
 * 
 * @returns {Object}
 */
async function initMongo() {
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017', {
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    mongoClient.on('close', _ => logger.warning('MongoDB connection closed'));
    mongoClient.on('error', err => logger.error(`MongoDB error: ${err}`));
    await mongoClient.connect();
    logger.debug("MongoDB connected");
    db = mongoClient.db("radiotxt");
    for (const name of ['csp', 'csp-fails']) {
      mongo[name] = db.collection(name);
      logger.debug(`MongoDB ${name} collection ready`);
    }

  } catch (err) {
    logger.error(`MongoDB connection failed: ${err}`);
    throw err;
  }
}

/**
 * gets a mongo collection
 * 
 * @param {String} name 
 * 
 * @returns {Object} mongodb collection
 */
function getCollection(name) {
  if (!mongo[name]) {
    throw new Error(`Mongo collection "${name}" not initialized`);
  }
  return mongo[name];
}

/**
 * mongo startup
 */
async function bootstrap() {
  await initMongo();
}

/**
 * clsoes the mongoDB connection
*/
async function closeMongo() {
  if (!mongoClient) return;
  await mongoClient.close();
  logger.warning("MongoDB connection closed");
}

bootstrap().catch(err => {
  logger.error(`Startup failed: ${err}`);
  process.exit(1);
});

/**
 * creates redis client object
 * 
 * @returns {Object}
 */
function getRedisClient() {
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

const redisClient = getRedisClient();

/**
 * application shutdown callback
 * 
 * @returns {void}
 */
async function shutdown() {
  try {
    logger.debug("Shutting down...");
    await redisClient.close();
    await closeMongo();
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
  logger,
  redisClient,
  logLevel,
  workos,
  getCollection
}