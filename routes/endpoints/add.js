const {validationResult} = require('express-validator');

const Logger = require('../../util/logger.js');
const isLiveStream = require('../../util/isLiveStream.js');
const Stations = require('../../util/Stations.js');

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
 * @param {Object} db - The MongoDB database object used to insert the new station.
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
 *   addToDatabase(db, req, res)
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
    const message = errors.array()[0].msg;
    log.error(message);
    return res.status(400).json({message});
  }
  const sql = new Stations('data/customradio.db');
  const {url} = req.body;
  log.info(`${req.ip} -> /add ${url} ${Date.now() - req.startTime}ms`);
  try {
    const exists = await sql.exists(url);

    if (exists) {
      await sql.close();
      const message = 'station exists';
      log.warning(`${message} ${Date.now() - req.startTime}ms`);
      res.json({message});
      return;
    }
    const status = await isLiveStream(url);
    if (!status.ok) {
      await sql.close();
      const message = `Connection test failed: ${status.error}`;
      log.warning(`${message}, ${Date.now() - req.startTime}ms`);
      res.json({message});
      return;
    }

    if (!status.name) {
      await sql.close();
      const message = `Failed getting station name`;
      log.warning(`${message}, ${Date.now() - req.startTime}ms`);
      res.json({message});
      return; 
    }

    const data = {
      name: status.name,
      url,
      online: status.isLive,
      genre: status.genre || 'Unknown',
      'content-type': status.content,
      bitrate: status.bitrate || 'Unknown',
      icon: status.icon || 'Unknown',
      homepage: status.icyurl || 'Unknown',
      error: '',
      duplicate: false,
    };

    const id =  await sql.addStation(data);
    await sql.close();
    const message = `station saved, id: ${id}`;
    log.info(`${message} ${Date.now() - req.startTime}ms`);
    res.json({message});
  } catch (e) {
    await sql.close();
    const message = `Failed to add station: ${e.message}`;
    log.critical(`${message}, ${Date.now() - req.startTime}ms`);
    res.status(500).json({message});
  }
};