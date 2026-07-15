const pack = require('../package.json');
const express = require('express');
const { scheduleJob } = require('node-schedule');
const app = express();
require('dotenv').config();

const { logger, logLevel, alerts, mongo } = require('./services.js');
const { testStreams } = require('./util/testStreams.js');
const scrapeIceDir = require('./util/scrapeIcecastDirectory.js');
const middleware = require('./middleware/middleware.js');
const routes = require('./routes/routes.js');
const { httpRequestCounter, register } = require('./util/promClient.js');

async function cleanDB() {
  try {
    await alerts.cleanupExpired();
    await alerts.cleanupOldVersions();
    const { deleted, cutoff } = await mongo.cleanupRequests();
    logger.info(`Deleted ${deleted} requests older than ${cutoff.toISOString()}`);
  } catch(err) {
    logger.error(`Failed to clean database: ${err}`);
  }
}

/**
 * Starts the Express server and sets up necessary initializations.
 * 
 * This function listens on port 3000 and performs the following tasks:
 * 1. Schedules a recurring jobs to test streams every day at midnight and scrape Icecast DB monthly.
 * 2. Logs a message indicating that the server is online.
 * 
 * @function
 * 
 * @returns {void}
 * 
 * @example
 * // Starting the server
 * app.listen(3000, _ => {
 *   console.log('Online. o( ❛ᴗ❛ )o');
 * });
 */
(async () => {
  try {
    await mongo.initConnection();
    middleware(app, httpRequestCounter);
    routes(app, register);

    scheduleJob('0 0 * * 0', testStreams);
    scheduleJob('0 12 1 * *', scrapeIceDir);
    scheduleJob('0 0 1 * *', cleanDB);

    app.listen(3000, _ => {
      logger.critical(`${pack.name} V:${pack.version} - Online. o( ❛ᴗ❛ )o, log_level: ${logLevel.toUpperCase()}`);
    });
  } catch (err) {
    logger.critical(err);
    process.exit(1);
  }
})();