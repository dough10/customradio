const asyncHandler = require('../../util/asyncHandler.js');
const {badActor} = require('../../util/badActors.js');

/**
 * Set of sensitive path segments that indicate potential attacks or probing.
 * @type {Set<string>}
 */
const sensitivePaths = new Set([
  '/.env',
  '/.git',
  '.ssh',
  '.json',
  'wp-admin',
  'wp-login',
  'phpmyadmin',
  '.aws',
  '.old',
  '.save',
  '.php'
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
    requestedPath = decodeURIComponent(req.originalUrl).toLowerCase();
  } catch {
    requestedPath = req.originalUrl.toLowerCase();
  }

  for (const sensitive of sensitivePaths) {
    if (requestedPath.includes(sensitive)) {
      await badActor(req.ip);
      break;
    }
  }

  res.status(404).send();
});