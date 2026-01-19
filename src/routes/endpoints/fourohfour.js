const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * Set of sensitive path segments that indicate potential attacks or probing.
 * @type {Set<string>}
 */
const sensitivePaths = new Set([
  '.env',
  'wp-admin',
  '.git',
  '.ssh',
  '.json',
  '.yml',
  '.sql'
]);

/**
 * Express handler for 404 errors, logs request details.
 * Detects and logs security-sensitive path patterns.
 *
 * @async
 * @function
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 */
module.exports = async (req, res) => {
  try {
    const requestedPath = decodeURIComponent(req.originalUrl);
    
    // Check if any sensitive path segment appears in the requested URL
    for (const sensitive of sensitivePaths) {
      if (requestedPath.includes(sensitive)) {
        log.warning(`Sensitive path accessed: ${requestedPath} | IP: ${req.ip} | User-Agent: ${req.get('User-Agent')}`);
        break;
      }
    }
  
    res.status(404).send();
  } catch(err) {
    log.error(`Unhandled error in 404 handler: ${err.message}`);
    res.status(404).send();
  }
};