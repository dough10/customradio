const pack = require('../package.json');
const express = require('express');
const schedule = require('node-schedule');
const app = express();
require('dotenv').config();

const { testStreams } = require('./util/testStreams.js');
const scrapeIceDir = require('./util/scrapeIcecastDirectory.js');
const middleware = require('./middleware/middleware.js');
const routes = require('./routes/routes.js');
const { httpRequestCounter, register } = require('./util/promClient.js');
const {logger, logLevel, alerts} = require('./services.js');

/**
 * Starts the Express server and sets up necessary initializations.
 * 
 * This function listens on port 3000 and performs the following tasks:
 * 1. Schedules a recurring jobs to test streams every day at midnight and scrape Icecast DB monthly.
 * 2. Logs a message indicating that the server is online.
 * 
 * @function
 * @param {number} port - The port number on which the server listens.
 * @param {Function} callback - The function to be called once the server starts.
 * 
 * @returns {void}
 * 
 * @example
 * // Starting the server
 * app.listen(3000, _ => {
 *   console.log('Online. o( ❛ᴗ❛ )o');
 * });
 */
app.listen(3000, _ => {
  middleware(app, httpRequestCounter);
  routes(app, register);
  
  schedule.scheduleJob('0 0 * * 0', testStreams);
  schedule.scheduleJob('0 12 1 * *', scrapeIceDir);
  schedule.scheduleJob('0 0 1 * *', async _ => {
    await alerts.cleanupExpired();
    await alerts.cleanupOldVersions();
  });
  
  logger.critical(`${pack.name} V:${pack.version} - Online. o( ❛ᴗ❛ )o, log_level: ${logLevel.toUpperCase()}`);
});