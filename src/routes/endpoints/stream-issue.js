const {validationResult} = require('express-validator');

const { t } = require('../../util/i18n.js');
const {stations, logger} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

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
module.exports = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = errors.array().map(e => e.msg).join(', ');
    logger.error(error);
    res.status(400).json({error});
    return;
  }

  const {id, error} = req.body;

  await stations.logStreamError(id, error);
  res.json({
    message: t('errorLog')
  });
});