const addToDatabase = require('./endpoints/add.js');
const getStations = require('./endpoints/stations.js');
const streamIssue = require('./endpoints/stream-issue.js');
const cspReport = require('./endpoints/csp-report.js');
const markDuplicate = require('./endpoints/markDuplicate.js');
const sitemap = require('./endpoints/sitemap.js');
const robots = require('./endpoints/robots.js');
const reportPlay = require('./endpoints/reportPlay.js');
const saveStation = require('./endpoints/saveStation.js');
const securitytxt = require('./endpoints/securitytxt.js');
const ads = require('./endpoints/ads.js');
const topGenres = require('./endpoints/topGenres.js');
const fourohfour = require('./endpoints/fourohfour.js');
const info = require('./endpoints/info.js');
const changelog = require('./endpoints/changeLog.js');
const authenticate = require('../util/auth.js');
const updatedb = require('./endpoints/updatedb.js');
const auth = require('./endpoints/auth.js');
const authCallback = require('./endpoints/auth.callback.js');
const userStations = require('./endpoints/userStations.js');
const index = require('./endpoints/index.js');

const cspValidator = require('../schema/cspValidaton.js');
const addStationValidator = require('../schema/addStationValidator.js');
const streamIssueValidator = require('../schema/streamIssueValidator.js');
const markDuplicateValidator = require('../schema/markDuplicateValidator.js');
const stationsValidator = require('../schema/stationsValidator.js');
const userStationValidatior = require('../schema/userStationValidatior.js');

const wosMiddleware = require('./../util/wosMiddleware.js');


module.exports = async (app, register) => {
  /** 
   * robots.txt
   */
  app.get('/robots.txt', robots);

  /**
   * ads.txt
   */
  app.get(['/app-ads.txt', '/ads.txt'], ads);

  /**
   * sitemap
   */
  app.get(['/sitemap.xml', '/sitemaps.xml', '/sitemap_index.xml'], sitemap);

  /**
   * assetLinks
   */
  app.get('/.well-known/assetLinks.json', (req,res) => res.json([]));

  /**
   * security.txt
   */
  app.get('/.well-known/security.txt', securitytxt);

  /**
   * info!
   */
  app.get('/info', info);

  /**
   * change log
   */
  app.get('/changelog.txt', changelog);

  /**
   * sellers.json
   */
  app.get('/sellers.json', (req, res) => res.json({
    "sellers": []
  }));

  /**
   * Index
   */
  app.get('/', await wosMiddleware, index);

  /**
   * index.htnml redirect to /
   */
  app.get('/index.html', (req, res) => res.redirect('/'));

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
  app.post('/mark-duplicate', markDuplicateValidator, markDuplicate);

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
  app.post('/stream-issue', streamIssueValidator, streamIssue);

  /**
   * Handles the request to retrieve the top genres from the database.
   *
   * This function connects to a SQLite database, aggregates the genres,
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
  app.get('/topGenres', topGenres);

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
  app.get('/stations', await wosMiddleware, stationsValidator, getStations);

  /**
   * Handles GET requests to the '/userStations' endpoint.
   * 
   * Validates the request to ensure the user is authenticated. Fetches and returns a list of
   * user-specific audio stations from the database.
   * 
   * @function
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * 
   * @returns {Promise<void>} - A promise that resolves when the response has been sent.
   * 
   * @throws {express.Response} 401 - If the user is not authenticated.
   * @throws {express.Response} 500 - If an error occurs while fetching user stations.
   * 
   * @example
   * // Example request:
   * app.get('/userStations', (req, res) => {
   *   // Request headers:
   *   // Authorization: Bearer <token>
   * });
   * // Example response:
   * [
   *   {
   *     "name": "My Favorite Station",
   *     "url": "http://example.com/my-favorite",
   *     "bitrate": 128
   *   },
   *   {
   *     "name": "Another Station",
   *     "url": "http://example.com/another-station",
   *     "bitrate": 256
   *   }
   * ]
   */
  app.get('/userStations', await wosMiddleware, userStations);

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
  app.post('/add', addStationValidator, await wosMiddleware, addToDatabase);

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
  app.post('/csp-report', cspValidator, cspReport);

  /**
   * Reports a playMinute for a station and increments its playMinute count
   * Rate limited to one request per IP address every 5 minutes
   * 
   * @param {ReportPlayRequest} req Express request object
   * @param {Response} res Express response object
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} If play count increment fails
   */
  app.post('/reportPlay/:id', await wosMiddleware, reportPlay);

  /**
   * report if station is in a users txt list
   */
  app.post('/reportInList/:id', await wosMiddleware, userStationValidatior, saveStation);

  /** 
   * Endpoint to begin updating the database.
   */
  app.get('/updatedb', await authenticate, updatedb);

  /**
   * Endpoint for authentication using WorkOS SSO.
   */
  app.get('/auth', auth);

  /**
   * Endpoint for handling the authentication callback from WorkOS.
   */
  app.get('/auth/callback', authCallback);

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