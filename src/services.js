require('dotenv').config();

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

/**
 * Initalize mongodb
 * 
 * @returns {Object}
 */
async function initMongo(col) {
  try {
    const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017');
    await client.connect();
    logger.debug("MongoDB Connected");
    const db = client.db("radiotxt");
    const collection = db.collection(col);
    return {collection, client};
  } catch(err) {
    throw err;
  }
}

let mongoDB;
let mongoClient;

initMongo("csp").then(({collection, client}) => {
  mongoDB = collection;
  mongoClient = client;
  logger.debug("MongoDB ready");
}).catch(err => {
  logger.error(`MongoDB failed to connect: ${err}`);
});

/**
 * returns the mongodb collection
 * 
 * @returns {Object}
 */
function getMongo() {
  if (!mongoDB) throw new Error("MongoDB not initialized");
  return mongoDB;
}

/**
 * clsoes the mongoDB connection
 */
async function closeMongo() {
  if (!mongoClient) return;
  await mongoClient.close();
  logger.warning("MongoDB connection closed");
}

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
  getMongo,
  initMongo
}