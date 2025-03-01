const express = require('express');
const schedule = require('node-schedule');
const app = express();
const Redis = require('ioredis');
const promClient = require('prom-client');
require('dotenv').config();

const { testStreams } = require('./util/testStreams.js');
const scrapeIceDir = require('./util/scrapeIcecastDirectory.js');
const middleware = require('./routes/middleware.js');
const routes = require('./routes/routes.js');
const DbConnector = require('./util/dbConnector.js');
const Logger = require('./util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const DB_HOST = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';
const DB_COLLECTION = 'stations';
const connector = new DbConnector(DB_HOST, DB_COLLECTION);

// Set up Prometheus metrics
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
const register = new promClient.Registry();
register.setDefaultLabels({
  app: 'customradio-api'
});
promClient.collectDefaultMetrics({
  register
});
register.registerMetric(httpRequestCounter);

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
 *   log('Online. o( ❛ᴗ❛ )o');
 * });
 */
app.listen(3000, async _ => {
  try {
    // Connect to the database
    const db = await connector.connect();

    const redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || ''
    });
    redis.on('error', err => { 
      log.error(`Redis error: ${err}`); 
    });
    redis.on('connect', () => {
      log.info('Redis connected');
    });
    
    // Set up middleware and routes
    middleware(app, httpRequestCounter);
    routes(app, db, redis, register);
    
    // Log server start message
    const pack = require('./package.json');
    log.info(`${pack.name} V:${pack.version} - Online. o( ❛ᴗ❛ )o, log_level: ${logLevel}`);
    
    // Schedule jobs
    schedule.scheduleJob('0 0 * * 0', _ => testStreams(db));
    schedule.scheduleJob('0 12 1 * *', _ => scrapeIceDir(db));
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
});