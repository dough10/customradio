const express = require('express');
const validator = require('validator');
const { query, body } = require('express-validator');
const compression = require('compression');
const path = require('path');
const schedule = require('node-schedule');
const app = express();
const multer = require('multer');
const upload = multer();
const Redis = require('ioredis');
const promClient = require('prom-client');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();


const addToDatabase = require('./routes/add.js');
const getStations = require('./routes/stations.js');
const log = require('./util/log.js');
const { testStreams } = require('./util/testStreams.js');
const streamIssue = require('./routes/stream-issue.js');
const cspReport = require('./routes/csp-report.js');
const DbConnector = require('./util/dbConnector.js');
const markDuplicate = require('./routes/markDuplicate.js');
const sitemap = require('./routes/sitemap.js');
const robots = require('./routes/robots.js');
const securitytxt = require('./routes/securitytxt.js');
const ads = require('./routes/ads.js');
const topGenres = require('./routes/topGenres.js');
const fourohfour = require('./routes/fourohfour.js');
const fahq = require('./routes/fahq.js');

const DB_HOST = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';


const DB_COLLECTION = 'stations';


const connector = new DbConnector(DB_HOST, DB_COLLECTION);


let db;


const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || ''
});


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

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.set('trust proxy', true);
app.disable('x-powered-by');

/**
 * serves static files
 */
app.use(express.static(path.join(__dirname, 'html')));

/**
 * middleware for timing response times
 */
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

/**
 * counts connection requests
 */
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

/**
 * cors
 */
app.use(cors({
  origin: ['https://customradio.dough10.me'],
  methods: ['GET', 'POST'],
}));

/**
 * Middleware to handle Content Security Policy (CSP) violation reports.
 * 
 * This middleware checks if the incoming request is of the type `application/csp-report`.
 * If so, it listens for data chunks, aggregates them into a complete body,
 * and then attempts to parse the body as JSON. If parsing succeeds, the JSON object
 * is assigned to `req.body`. If parsing fails, a 400 error response is sent back to the client.
 * For all other request types, the middleware simply calls `next()` to pass control to the next middleware.
 * 
 * @param {import('express').Request} req - The HTTP request object.
 * @param {import('express').Response} res - The HTTP response object.
 * @param {function} next - The next middleware function in the stack.
 * 
 * @returns {void} This function does not return a value, but may send a response or call next().
 */
app.use((req, res, next) => {
  if (req.is('application/csp-report')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(body);
        next();
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    });
  } else {
    next();
  }
});


/**
 * Middleware function to validate API access tokens.
 * 
 * This middleware checks the `Authorization` header of the incoming request for a Bearer token.
 * If the token matches the token stored in the environment variable `TOKEN`, it calls the `next` middleware function.
 * If the token is missing or incorrect, it responds with a 403 Forbidden status and an error message.
 *
 * @param {Object} req - The request object, which contains the headers and other request details.
 * @param {Object} res - The response object, used to send responses to the client.
 * @param {Function} next - The callback function to pass control to the next middleware function.
 * 
 * @throws {Error} If the token is invalid or not provided, responds with a 403 status and an error message.
 * 
 * @example
 * // Example usage in an Express.js app
 * const express = require('express');
 * const app = express();
 * 
 * app.use(apiKeyMiddleware);
 * 
 * app.get('/secure-data', (req, res) => {
 *   res.json({ data: 'This is protected data.' });
 * });
 */
function apiKeyMiddleware(req, res, next) {
  const key = req.headers.authorization;
  if (key && key.split(' ')[1] === process.env.TOKEN) {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Invalid Access Token' });
}

/** 
 * robots.txt
 */
app.get('/robots.txt', robots);

/**
 * ads.txt
 */
app.get('/ads.txt', ads);

/**
 * sitemap
 */
app.get(['/sitemap.xml', '/sitemaps.xml', '/sitemap_index.xml'], sitemap);

/**
 * assetLinks
 */
app.get('/.well-known/assetLinks.json', (req,res) => {
  log(`${req.ip} -> /.well-known/assetLinks.json`);
  res.json([]);
});

/**
 * security.txt
 */
app.get('/.well-known/security.txt', securitytxt);

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
 * endpoint for marking a station as a duplicate
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * 
 * @param {express.Request} req.body - The body of the request.
 * @param {string} req.body.url - The URL of the station. Must be a valid URL.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If validation fails or required fields are missing.
 * @throws {express.Response} 500 - If an error occurs while adding the station to the database.
 */
app.post('/mark-duplicate', upload.none(), [
  body('url').trim().isURL().withMessage('Invalid URL')
], (req, res) => markDuplicate(db, req, res));

/**
 * An endpoint for audio stream playback error callback
 * 
 * When a stream fails to play frontend will capture URL that caused the issue and post it here for manual check.
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * 
 * @param {express.Request} req.body - The body of the request.
 * @param {string} req.body.url - The URL of the station. Must be a valid URL.
 * @param {string} req.body.error - The error.message string from frontend.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If validation fails or required fields are missing.
 * @throws {express.Response} 500 - If an error occurs while adding the station with the issue to the database.
 */
app.post('/stream-issue', upload.none(), [
  body('url').trim().isURL().withMessage('Invalid URL'),
  body('error').trim().escape().isString().withMessage('Error meessage must be a string')
], (req, res) => streamIssue(db, req, res));

/**
 * Handles the request to retrieve the top genres from the database.
 *
 * This function connects to a MongoDB database, aggregates the genres,
 * and returns the top 10 genres sorted alphabetically.
 *
 * @async
 * @function
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns a promise that resolves when the response has been sent.
 * 
 * @throws {Error} Throws an error if there is an issue with the database connection
 *                 or during the aggregation process. The response will be sent with a 500 status code
 *                 and an error message.
 *
 * @example
 * // Example of calling the function
 * const express = require('express');
 * const app = express();
 * const getTopGenres = require('./path/to/your/function');
 * 
 * app.get('/topGenres', getTopGenres);
 */
app.get('/topGenres', (req, res) => topGenres(redis, req, res))

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
 *   "message": "station saved"
 * }
 * 
 * // Example response when station already exists:
 * {
 *   "message": "station exists"
 * }
 * 
 * // Example error response:
 * {
 *   "error": "Failed to add station"
 * }
 */
app.post('/add', upload.none(), [
  body('url').trim().isURL().withMessage('Invalid URL')
], (req, res) => addToDatabase(db, redis, req, res));

/**
 * @api {post} /csp-report Receive Content Security Policy Violation Reports
 * @apiName PostCspReport
 * @apiGroup Security
 * 
 * @apiDescription
 * This endpoint receives Content Security Policy (CSP) violation reports from web browsers. 
 * The reports are sent when a CSP directive is violated on the client side. 
 * The reports contain details about the violation, such as the blocked resource and the violated directive.
 * 
 * The endpoint logs the CSP report to the console for monitoring purposes. 
 * In a production environment, you might want to handle these reports differently, 
 * such as storing them in a database, sending notifications, or analyzing the data to refine CSP rules.
 * 
 * @apiParam {Object} csp-report The CSP report object sent by the browser. The structure of this object follows the CSP reporting specification.
 * 
 * @apiParamExample {json} Request-Example:
 * {
 *   "csp-report": {
 *     "document-uri": "https://example.com/page",
 *     "referrer": "",
 *     "blocked-uri": "https://evil.com/malicious.js",
 *     "violated-directive": "script-src",
 *     "original-policy": "default-src 'self'; script-src 'self'; report-uri /csp-report;",
 *     "source-file": "https://example.com/page",
 *     "status-code": 200
 *   }
 * }
 * 
 * @apiSuccess (Success 204) {String} No Content No content is returned on success.
 * 
 * @apiError (Error 400) BadRequest The request body is malformed or missing required fields.
 * 
 * @apiErrorExample {json} Error-Response:
 * {
 *   "error": "Invalid request body"
 * }
 * 
 * @apiSampleRequest /csp-report
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 204 No Content
 */
app.post('/csp-report', apiKeyMiddleware, upload.none(), [
  body('csp-report').isObject().withMessage('csp-report must be an object'),
  body('csp-report.document-uri').isURL().withMessage('document-uri must be a valid URL'),
  body('csp-report.referrer').optional().custom(value => {
    if (value === '' || value === null) return true;
    return validator.isURL(value);
  }).withMessage('referrer must be a valid URL'),
  body('csp-report.blocked-uri').custom(value => {
    if (value === 'inline' || validator.isURL(value)) {
      return true;
    }
    throw new Error('blocked-uri must be a valid URL or "inline"');
  }).withMessage('blocked-uri must be a valid URL or "inline"'),
  body('csp-report.violated-directive').isString().withMessage('violated-directive must be a string'),
  body('csp-report.original-policy').isString().withMessage('original-policy must be a string'),
  body('csp-report.source-file').optional().isURL().withMessage('source-file must be a valid URL'),
  body('csp-report.status-code').isInt({ min: 100, max: 599 }).withMessage('status-code must be an integer between 100 and 599'),
], cspReport);

/**
 * Catch-all route for handling 404 errors.
 * 
 * @summary Logs the request details and responds with a 404 error in JSON format.
 * 
 * @description This route catches all requests that do not match any defined routes.
 * It logs the request details (protocol, host, and pathname) and responds with a 404 status code and a JSON message.
 * 
 * @name CatchAll
 * @function
 * @memberof module:routes/errors
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * 
 * @returns {void} Responds with a 404 status code and a JSON error message.
 */
app.get('*', fourohfour);

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
  const pack = require('./package.json');
  log(`${pack.name} V:${pack.version}`);
  log('Online. o( ❛ᴗ❛ )o');
  schedule.scheduleJob('0 0 * * 0', _ => testStreams(db));
});