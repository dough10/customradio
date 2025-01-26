const express = require('express');
const schedule = require('node-schedule');
const app = express();
const Redis = require('ioredis');
const DbConnector = require('./util/dbConnector.js');
require('dotenv').config();


const log = require('./util/log.js');
const { testStreams } = require('./util/testStreams.js');
const middleware = require('./routes/middleware.js');
const routes = require('./routes/routes.js');


const DB_HOST = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';
const DB_COLLECTION = 'stations';
const connector = new DbConnector(DB_HOST, DB_COLLECTION);

let db;
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || ''
});

middleware(app);

/**
 * Starts the Express server and sets up necessary initializations.
 * 
 * This function listens on port 3000 and performs the following tasks:
 * 1. Connects to the database using the provided configuration URL.
 * 2. Logs a message indicating that the server is online.
 * 3. Schedules a recurring job to test streams every day at midnight.
 * 
 * @function
 * @param {number} port - The port number on which the server listens.
 * @param {Function} callback - The function to be called once the server starts.
 * 
 * @returns {void}
 * 
 * @example
 * // Starting the server
 * app.listen(3000, async _ => {
 *   db = await connectToDb(DB_HOST);
 *   const pack = require('./package.json');
 *   log(`${pack.name} V:${pack.version}`);
 *   log('Online. o( ❛ᴗ❛ )o');
 *   schedule.scheduleJob('0 0 * * *', _ => testStreams(db));
 * });
 */
app.listen(3000, async _ => {
  db = await connector.connect();
  routes(app, db, redis);
  const pack = require('./package.json');
  log(`${pack.name} V:${pack.version} - Online. o( ❛ᴗ❛ )o`);
  schedule.scheduleJob('0 0 * * 0', _ => testStreams(db));
});