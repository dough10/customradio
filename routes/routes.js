const multer = require('multer');
const upload = multer();
const { query, body } = require('express-validator');
const pug = require('pug');

const Logger = require('./../util/logger.js');
const addToDatabase = require('./endpoints/add.js');
const getStations = require('./endpoints/stations.js');
const streamIssue = require('./endpoints/stream-issue.js');
const cspReport = require('./endpoints/csp-report.js');
const markDuplicate = require('./endpoints/markDuplicate.js');
const sitemap = require('./endpoints/sitemap.js');
const robots = require('./endpoints/robots.js');
const securitytxt = require('./endpoints/securitytxt.js');
const ads = require('./endpoints/ads.js');
const topGenres = require('./endpoints/topGenres.js');
const fourohfour = require('./endpoints/fourohfour.js');
const info = require('./endpoints/info.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * enviroment options for csp report. 
 * allows localhost as url when not in production.
 * 
 * @returns {undefined|String}
 */
function options() {
  const option = {
    require_tld: false,
    require_protocol: true,
    require_port: true
  };
  const production = process.env.NODE_ENV === 'production';
  return production ? undefined : option; 
}

const envOptions = options();

log.debug(envOptions);

module.exports = (app, register) => {
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
    log.info(`${req.ip} -> /.well-known/assetLinks.json ${Date.now() - req.startTime}ms`);
    res.json([]);
  });

  /**
   * security.txt
   */
  app.get('/.well-known/security.txt', securitytxt);

  /**
   * info!
   */
  app.get('/info', info);

  /**
   * Index
   */
  app.get('/', (req, res) => {
    log.info(`${req.ip} -> /  ${Date.now() - req.startTime}ms`);
    res.send(pug.renderFile('./templates/index.pug'));
  });

  /**
   * index.htnml redirect to /
   */
  app.get('/index.html', (req, res) => {
    res.redirect('/');
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
    body('id')
      .trim()
      .escape()
      .isString()
      .notEmpty()
      .withMessage('Invalid ID paramater')
  ], (req, res) => markDuplicate(req, res));

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
    body('id')
      .trim()
      .escape()
      .isString()
      .notEmpty()
      .withMessage('Invalid or missing ID paramater'),
    body('error')
      .trim()
      .escape()
      .isString()
      .notEmpty()
      .withMessage('Error meessage must be a string')
  ], (req, res) => streamIssue(req, res));

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
   * const getTopGenres = require('./endpoints/path/to/your/function');
   * 
   * app.get('/topGenres', getTopGenres);
   */
  app.get('/topGenres', (req, res) => topGenres(req, res));

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
      .isString()
      .withMessage('Genres must be a string'),
  ], (req, res) => getStations(req, res));

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
    body('url')
      .isURL(envOptions)
      .notEmpty()
      .withMessage('Invalid URL')
  ], (req, res) => addToDatabase(req, res));

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
  app.post('/csp-report', upload.none(), [
    body('csp-report')
      .isObject()
      .withMessage('csp-report must be an object'),
    body('csp-report.document-uri')
      .isURL(envOptions)
      .withMessage('document-uri must be a valid URL'),
    body('csp-report.referrer')
      .optional()
      .custom(value => {
      if (value === '' || value === null) return true;
      return validator.isURL(value);
    }).withMessage('referrer must be a valid URL'),
    body('csp-report.blocked-uri')
      .isURL(envOptions)
      .withMessage('blocked-uri must be a valid URL'),
    body('csp-report.violated-directive')
      .escape()
      .isString()
      .withMessage('violated-directive must be a string'),
    body('csp-report.original-policy')
      .escape()
      .isString()
      .withMessage('original-policy must be a string'),
    body('csp-report.source-file')
      .optional()
      .isURL(envOptions)
      .withMessage('source-file must be a valid URL'),
    body('csp-report.status-code')
      .isInt({ min: 100, max: 599 })
      .withMessage('status-code must be an integer between 100 and 599'),
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
};