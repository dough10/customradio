const {validationResult} = require('express-validator');

const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

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
module.exports = async (db, req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errors = errors.array();
    log.error(JSON.stringify(errors));
    return res.status(400).json({errors});
  }

  const {url} = req.body;
  log.info(`${req.ip} -> /mark-duplicate ${url}`);
  try {
    const result = await db.updateOne(
      {url}, 
      { 
        $set: { 
          duplicate: true
        } 
      }
    );
    if (result.matchedCount === 0) {
      const message = "Document not found";
      log.error(message);
      return res.status(404).json({message});
    }
    res.json({
      message: "Duplicate logged"
    });
  } catch(error) {
    const message = `Failed to log error: ${entryError.message}`;
    log.error(message);
    res.status(500).json({message});
  }
};