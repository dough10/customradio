const { validationResult } = require('express-validator');

const isLiveStream = require('../../util/isLiveStream.js');
const { t } = require('../../util/i18n.js');
const { logger, stations } = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

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
module.exports = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    // logger.error(message);
    return res.status(400).json({ message });
  }

  const { url } = req.body;

  const exists = await stations.exists(url);

  if (exists) {
    return res.status(409).json({ message: t('stationExists') });
  }

  const { 
    ok, 
    error, 
    status, 
    name, 
    isLive, 
    genre, 
    content, 
    bitrate, 
    icon, 
    icyurl 
  } = await isLiveStream(url);

  if (!ok) {
    // logger.warning(`Test failed: ${error}`);
    return res.status(status).json({ message: t('conTestFailed', error) });
  }

  const data = {
    name: name || 'Unknown',
    url,
    online: isLive,
    genre: genre || 'Unknown',
    'content-type': content,
    bitrate: bitrate || 0,
    icon: icon || 'Unknown',
    homepage: icyurl || 'Unknown',
    error: '',
    duplicate: false
  };

  const id = await stations.addStation(data);
  res.status(201).json({ message: t('stationSaved', id) });
});