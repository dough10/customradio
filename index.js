const express = require('express');
const {query, body} = require('express-validator');
const compression = require('compression');
const path = require('path');
const schedule = require('node-schedule');
const app = express();
const multer = require('multer');
const upload = multer();
const Redis = require('ioredis');
const promClient = require('prom-client');
require('dotenv').config();


const addToDatabase = require('./routes/add.js');
const getStations = require('./routes/stations.js');
const log = require('./util/log.js');
const connectToDb = require('./util/connectToDb.js');
const {testStreams} = require('./util/testStreams.js');


const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: 6379
});


const register = new promClient.Registry();

register.setDefaultLabels({
  app: 'customradio-api'
});

promClient.collectDefaultMetrics({ register });

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestCounter);

app.use(compression());
app.use(express.json());
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'html')));
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode
    });
  });
  next();
});

let db;


const DB_HOST = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';


/**
 * Handles GET requests to the root URL ('/').
 * Logs the IP address of the requester and sends the 'index.html' file as the response.
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} [next] - The optional next middleware function.
 * 
 * @returns {void}
 * 
 * @example
 * // Example usage:
 * app.get('/', (req, res) => {
 *   log(`${req.ip} -> /`);
 *   res.sendFile(path.join(__dirname, 'html', 'index.html'));
 * });
 */
app.get('/', async (req, res) => {
  const cacheKey = 'index.html';
  const cachedPage = await redis.get(cacheKey);

  log(`${req.ip} -> /`);

  if (cachedPage) {
    res.set('Content-Type', 'text/html');
    return res.send(cachedPage);
  }
  const filePath = path.join(__dirname, 'html', 'index.html');
  res.sendFile(filePath, async (err) => {
    if (err) {
      res.status(500).send('Error serving the index.html file');
      return;
    }
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(filePath, 'utf8');
    await redis.set(cacheKey, fileContent, 'EX', 3600);
  });
});

/**
 * GET /metrics
 * @summary Exposes Prometheus metrics for scraping.
 * @description This route handler exposes all the collected Prometheus metrics for the Node.js Express application. It sets the content type to the type required by Prometheus and sends the collected metrics.
 * 
 * @name GetMetrics
 * @function
 * @async
 * @memberof module:routes/metrics
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * 
 * @returns {Promise<void>} Sends the collected metrics as the response body.
 * 
 * @example
 * // Example request to the /metrics endpoint
 * // GET http://localhost:3000/metrics
 * // Response:
 * // # HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
 * // # TYPE process_cpu_user_seconds_total counter
 * // process_cpu_user_seconds_total 0.12
 * // ...
 */
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * Handles GET requests to the '/stations' endpoint.
 * 
 * Validates the query parameter `genres` to ensure it is a string. Fetches and returns a list of radio stations that match the specified genres.
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * 
 * @param {express.Request} req.query - The query parameters of the request.
 * @param {string} req.query.genres - A comma-separated string of genres to filter the radio stations.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If the `genres` parameter is not a string or validation fails.
 * @throws {express.Response} 500 - If an error occurs while fetching the stations.
 * 
 * @example
 * // Example request:
 * app.get('/stations?genres=rock,pop', (req, res) => { ... });
 * 
 * // Example response:
 * [
 *   {
 *     "name": "Rock Station",
 *     "url": "http://example.com/rock",
 *     "bitrate": 128
 *   },
 *   {
 *     "name": "Pop Station",
 *     "url": "http://example.com/pop",
 *     "bitrate": 256
 *   }
 * ]
 */
app.get('/stations', [
  query('genres')
  .trim()
  .escape()
  .isString().withMessage('Genres must be a string'),
], (req, res) => getStations(db, redis, req, res));

/**
 * Handles POST requests to the '/add' endpoint.
 * 
 * Validates the request body to ensure `name` and `url` are provided and valid. 
 * Checks if the station already exists in the database and, if not, adds it. 
 * Returns a success message or an error response.
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * 
 * @param {express.Request} req.body - The body of the request.
 * @param {string} req.body.name - The name of the station. Must be a non-empty string.
 * @param {string} req.body.url - The URL of the station. Must be a valid URL.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If validation fails or required fields are missing.
 * @throws {express.Response} 500 - If an error occurs while adding the station to the database.
 * 
 * @example
 * // Example request:
 * app.post('/add', (req, res) => {
 *   // Request body:
 *   // {
 *   //   "name": "Jazz Station",
 *   //   "url": "http://example.com/jazz"
 *   // }
 * });
 * 
 * // Example successful response:
 * {
 *   "message": "station saved o( ❛ᴗ❛ )o"
 * }
 * 
 * // Example response when station already exists:
 * {
 *   "message": "station exists"
 * }
 * 
 * // Example error response:
 * {
 *   "error": "Failed to add station (╬ Ò﹏Ó)"
 * }
 */
app.post('/add', upload.none(), [
  body('url').trim().isURL().withMessage('Invalid URL')
], (req, res) => addToDatabase(db, req, res));

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
 *   db = await connectToDb(config.url);
 *   log('Online. o( ❛ᴗ❛ )o');
 *   schedule.scheduleJob('0 0 * * *', _ => testStreams(db));
 * });
 */
app.listen(3000, async _ => {
  db = await connectToDb(DB_HOST);
  log('Online. o( ❛ᴗ❛ )o');
  schedule.scheduleJob('0 0 * * *', _ => testStreams(db));
});