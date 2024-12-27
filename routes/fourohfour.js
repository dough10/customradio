const url = require('url');
const log = require('../util/log.js');
const saveToCollection = require('../util/saveToCollection.js');

/**
 * Express handler for 404 errors, logs request details, saves to collection, 
 * and redirects to a Rickroll for certain paths.
 *
 * @async
 * @function
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @throws {Error} If there is an error while saving to the collection or logging.
 */
module.exports = async (req, res) => {
  /**
   * Construct the request URL information.
   * @type {Object}
   * @property {string} protocol - The protocol used in the request (e.g., 'http', 'https').
   * @property {string} host - The host from the request header (e.g., 'example.com').
   * @property {string} pathname - The requested path (e.g., '/some/path').
   */
  let reqadd = {
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  };
  
  log(`${req.ip} requested ${url.format(reqadd)} 404! ╭∩╮(︶︿︶)╭∩╮`);
  
  /**
   * Save the 404 error request details to a mongodb collection.
   * @type {Object} 
   * @property {string} protocol - The protocol used for the request.
   * @property {string} host - The host in the request.
   * @property {string} pathname - The requested URL path.
   * @property {string} time - The timestamp when the request occurred.
   * @property {string} ip - The IP address of the client making the request.
   * @property {string} agent - The user-agent string from the request headers.
   * @property {string} referer - The referer header from the request, if present.
   * @property {string} cookies - The cookies sent with the request, if any.
   */
  await saveToCollection({
    ...reqadd,
    time: new Date().toLocaleString(),
    ip: req.ip,
    agent: req.headers['user-agent'],
    referer: req.headers.referer,
    cookies: req.headers.cookies
  }, 'fourohfour');

  const requestedPath = decodeURIComponent(reqadd.pathname);

  /**
   * Array of sensitive paths that will trigger a redirect to a Rickroll if detected.
   * @type {string[]}
   */
  const sensitivePaths = ['.env', 'wp-admin', '.git', '.ssh', '.json', '.yml', '.sql'];

  // Check if the requested path contains any sensitive path and redirect accordingly
  for (const path of sensitivePaths) {
    if (requestedPath.includes(path)) {
      // Rickroll
      return res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }
  }

  // Respond with a 404 error and a custom message
  res.status(404).json({
    message: '╭∩╮(︶︿︶)╭∩╮'
  });
};