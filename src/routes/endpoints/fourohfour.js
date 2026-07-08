const asyncHandler = require('../../util/asyncHandler.js');
const { badActor } = require('../../util/badActors.js');
const logRequest = require('../../util/logRequest.js');
const pathIsSensative = require('../../util/pathIsSensative.js');

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

  if (pathIsSensative(requestedPath)) {
    await badActor(req.ip, 1);
    req.blocked = true;
    res.destroy();
    return;
  }


  res.status(404).send();
});