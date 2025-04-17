const {validationResult} = require('express-validator');

const Logger = require('../../util/logger.js');
const Stations = require('../../model/Stations.js');
const { t } = require('../../util/i18n.js');

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
 * @param {string} req.body.id - The id of the station. Must be a valid id.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If validation fails or required fields are missing.
 * @throws {express.Response} 500 - If an error occurs while adding the station to the database.
 */
module.exports = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    log.error(message);
    return res.status(400).json({message});
  }

  const sql = new Stations('data/customradio.db');
  const {id} = req.body;
  log.info(`${req.ip} -> /mark-duplicate ${id}`);
  try {
    await sql.markDuplicate(id);
    res.json({
      message: t('dupLogged')
    });
  } catch(error) {
    log.error(`Failed to log error: ${error.message}`);
    res.status(500).json({message: t('dupLogFail', error.message)});
  } finally {
    await sql.close();
  }
};