const {logger} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');
const {badActor} = require('../../util/badActors.js');

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
module.exports = asyncHandler(async (req, res) => {

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(req.originalUrl);
  } catch {
    requestedPath = req.originalUrl;
  }
  // Check if any sensitive path segment appears in the requested URL
  for (const sensitive of sensitivePaths) {
    if (requestedPath.includes(sensitive)) {
      badActor(req.ip);
      // logger.warning(`Sensitive path accessed: ${requestedPath} | IP: ${req.ip} | User-Agent: ${req.get('User-Agent')}`);
      break;
    }
  }

  res.status(404).send();
});