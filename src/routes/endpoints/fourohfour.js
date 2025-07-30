const url = require('url');

const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

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

  const message = '╭∩╮(︶︿︶)╭∩╮';
  log.error(`${reqadd.protocol}://${reqadd.host}${reqadd.pathname} - ${message}`);
  try {
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
    res.status(404).json({message});
  } catch(e) {
    res.status(404).json({message});
  }
};