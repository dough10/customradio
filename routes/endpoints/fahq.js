const saveToCollection = require('../../util/saveToCollection.js');
const Logger = require('../../util/logger.js');

const log = new Logger('info');

/**
 * logs details of the incoming request to a collection and returns a 403 status.
 *
 * This endpoint captures specific request details and stores them in a collection, presumably for
 * logging purposes (e.g., monitoring, analytics, or error tracking). It then responds with a 403 Forbidden
 * status, indicating that the request is not allowed, but the system still logs the request data.
 *
 * The details captured include the following:
 * - Timestamp of when the request was received
 * - IP address from which the request originated
 * - User-Agent header which contains information about the client’s browser or device
 * - Referer header which contains the referring URL (if present)
 * - Cookies associated with the request
 *
 * The data is saved to a collection identified as 'fourohfour', which could be a custom collection name
 * (e.g., for logging 404 or other error responses). The actual saving is done using the `saveToCollection` utility
 * function.
 *
 * @async
 * @function
 * @param {Object} req - The request object containing the details of the incoming HTTP request.
 * @param {Object} res - The response object used to send the HTTP response back to the client.
 *
 * @returns {void} The function does not return a value, but it sends a 403 Forbidden status code as a response.
 *
 * @example
 * // Example of a client request:
 * // A request to this endpoint will trigger the following logging and response behavior:
 * // - Logs the protocol, host, pathname, timestamp, IP, agent, referer, and cookies.
 * // - Sends a 403 Forbidden response.
 *
 * app.use('/denied', fahq);
 */
module.exports = async (req, res) => {
  await saveToCollection({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl,
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers,
    time: new Date().toLocaleString(),
    ip: req.ip,
    forwardedFor: req.headers['x-forwarded-for'],
    referer: req.headers.referer || 'No Referer',
    cookies: req.headers.cookies || 'No Cookies',
    responseTime: Date.now() - req.startTime,
    sessionId: req.session ? req.session.id : null
  }, "Suspicious User-Agent");
  log.info(`${req.ip} ╭∩╮(︶︿︶)╭∩╮ FAHQ! ${Date.now() - req.startTime}ms`);
  res.status(403).send();
};