const { validationResult } = require('express-validator');

const Logger = require('../../util/logger.js');
const isLiveStream = require('../../util/isLiveStream.js');
const Stations = require('../../model/Stations.js');
const { t } = require('../../util/i18n.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * Handles the request to add a new station to the database.
 * 
 * This function validates the incoming request, extracts station details from the request body,
 * checks the online status of the station, and then adds the station to the database if it doesn't already exist.
 * It provides appropriate HTTP responses based on whether the station was added successfully or if it already exists.
 * 
 * @async
 * @function
 * 
 * @param {Object} req - The HTTP request object containing the station details in the body.
 * @param {Object} res - The HTTP response object used to send the results or error messages.
 * 
 * @returns {Promise<void>} A promise that resolves when the response has been sent.
 * 
 * @throws {Error} Throws an error if the database operations fail.
 * 
 * @example
 * 
 * app.post('/add', (req, res) => {
 *   addToDatabase(req, res)
 *     .then(() => {
 *       // Response is sent from within addToDatabase
 *     })
 *     .catch(err => {
 *       console.error('Failed to handle request:', err);
 *       res.status(500).json({ error: 'Internal server error' });
 *     });
 * });
 */
module.exports = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    log.error(message);
    return res.status(400).json({ message });
  }

  const sql = new Stations('data/customradio.db');
  const { url } = req.body;

  try {
    const exists = await sql.exists(url);

    if (exists) {
      log.warning(`Station already exists ${Date.now() - req.startTime}ms`);
      return res.status(409).json({ message: t('stationExists') });
    }

    const status = await isLiveStream(url);
    if (!status.ok) {
      log.warning(`Connection test failed: ${status.error}, ${Date.now() - req.startTime}ms`);
      return res.status(400).json({ message: t('conTestFailed', status.error)});
    }

    const data = {
      name: status.name || 'Unknown',
      url,
      online: status.isLive,
      genre: status.genre || 'Unknown',
      'content-type': status.content || 'Unknown',
      bitrate: status.bitrate || 0,
      icon: status.icon || 'Unknown',
      homepage: status.icyurl || 'Unknown',
      error: '',
      duplicate: false,
    };

    const id = await sql.addStation(data);
    log.info(`${message} ${Date.now() - req.startTime}ms`);
    res.status(201).json({ message: t('stationSaved', id) });
  } catch (e) {
    log.critical(`Failed to add station: ${e.message}, ${Date.now() - req.startTime}ms`);
    res.status(500).json({ message: t('addFail', e.message) });
  } finally {
    await sql.close();
  }
};