const {validationResult} = require('express-validator');

const Logger = require('../../util/logger.js');

const log = new Logger('info');

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
module.exports = async (db, req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }
  const {url, error} = req.body;
  log.info(`${req.ip} -> /stream-issue ${url} ${error}`);
  try {
    const result = await db.updateOne(
      {url}, 
      { $set: { error } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Document not found"
      });
    }
    res.json({
      message: "error logged"
    });
  } catch(entryError) {
    res.status(500).json({
      message: `Failed to log error: ${entryError.message}` 
    });
  }
};