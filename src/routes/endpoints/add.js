const { validationResult } = require('express-validator');

const Logger = require('../../util/logger.js');
const isLiveStream = require('../../util/isLiveStream.js');
const Stations = require('../../model/Stations.js');
const { t } = require('../../util/i18n.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const RESPONSE_CODES = Object.freeze({
  200: 'OK: The request was successful.',
  201: 'Created: The station was successfully added.',
  202: 'Accepted: The request has been accepted for processing, but the processing is not complete.',
  203: 'Non-Authoritative Information: The request was successful but the returned information may be from a third-party source.',
  204: 'No Content: The request was successful but there is no content to send in the response.',
  205: 'Reset Content: The request was successful but the client should reset the view.',
  206: 'Partial Content: The server is delivering only part of the resource due to a range header sent by the client.',
  400: 'Bad Request: The server can’t process your request.',
  401: 'Unauthorized: The server rejected your request due to missing or invalid authentication. ',
  402: 'Payment Required: The server rejected your request due to missing or invalid authentication.',
  403: 'Forbidden: The server understood your request but denied access.',
  404: 'Not Found: The requested resource could not be found.',
  405: 'Method Not Allowed: The request method is not supported for the requested resource.',
  406: 'Not Acceptable: The requested resource is not available in a format acceptable to the client.',
  408: 'Request Timeout: The server timed out waiting for the request.',
  409: 'Conflict: The request could not be completed due to a conflict with the current state of the resource.',
  410: 'Gone: The requested resource is no longer available and will not be available again.',
  411: 'Length Required: The server refuses to accept the request without a defined Content-Length.',
  500: 'Internal Server Error: The server encountered an unexpected condition that prevented it from fulfilling the request.',
});


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

  let sql;
  const { url } = req.body;
  
  try {
    sql = new Stations('data/customradio.db');
    const exists = await sql.exists(url);

    if (exists) {
      log.warning(`Station already exists`);
      return res.status(409).json({ message: t('stationExists') });
    }

    const status = await isLiveStream(url);
    if (!status.ok) {
      log.warning(`Connection test failed: ${status.error}`);
      return res.status(400).json({ message: t('conTestFailed', RESPONSE_CODES[status.error]) });
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
    res.status(201).json({ message: t('stationSaved', id) });
  } catch (e) {
    log.critical(`Failed to add station: ${e.message}`);
    res.status(500).json({ message: t('addFail', e.message) });
  } finally {
    if (!sql || typeof sql.close !== 'function') {
      return;
    }
    try {
      await sql.close();
    } catch (err) {
      log.error(`Error closing DB: ${err.message}`);
    }
  }
};