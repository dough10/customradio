const { WorkOS } = require('@workos-inc/node');
const { createClient } = require("redis");

const Stations = require('./model/Stations.js');
const UserData = require('./model/UserData.js');
const Alerts = require('./model/Alerts.js');
const Logger = require('./util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const logger = new Logger(logLevel);

const DB_PATH = 'data/customradio.db';

const stations = new Stations(DB_PATH);
const userData = new UserData(DB_PATH);
const alerts = new Alerts(DB_PATH);

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  password: process.env.REDIS_PASSWORD,
  legacyMode: false,
});

redisClient.connect().catch((error) => {
  logger.error("Redis connection error:", error);
  process.exit(1);
});

redisClient.on("error", err => logger.error(`Redis Client ${err}`));
redisClient.on("connect", () => logger.debug("Redis Connected"));

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

module.exports = {
  stations,
  userData,
  alerts,
  logger,
  redisClient,
  logLevel,
  workos
}