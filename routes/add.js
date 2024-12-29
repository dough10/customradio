const {validationResult} = require('express-validator');

const log = require('../util/log.js');
const isLiveStream = require('../util/isLiveStream.js');


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
module.exports = async (db, redis, req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }
  const {url} = req.body;
  log(`${req.ip} -> /add ${url}`);
  try {
    const exists = await db.findOne({
      url
    });
    if (exists) {
      log(`station exists ${Date.now() - req.startTime}ms`);
      res.json({
        message: 'station exists'
      });
      return;
    }
    const status = await isLiveStream(url);
    if (!status.ok) {
      const message = `Connection test failed: ${status.error} ${Date.now() - req.startTime}ms`;
      log(message);
      res.status(500).json({
        message: message
      });
      return;
    }

    if (!status.name) {
      const message = `Failed getting station name ${Date.now() - req.startTime}ms`;
      log(message);
      res.status(500).json({
        message: message
      });
      return; 
    }

    // clear stations cache
    try {
      const keys = await redis.keys('stations_*');
      if (keys.length > 0) {
        const removed = await redis.del(...keys);
        if (removed) log(`${removed} stations cache deleted`);
      }
    } catch(error) {
      log(`error deleting stations cache: ${error.message}`);
    }

    const data = {
      name: status.name,
      url,
      online: status.isLive,
      genre: status.genre,
      'content-type': status.content,
      bitrate: status.bitrate || 'Unknown',
      homepage: status.icyurl || 'Unknown'
    };

    await db.insertOne(data);
    const message = `station saved ${Date.now() - req.startTime}ms`;
    log(message);
    res.json({
      message: message
    });
  } catch (e) {
    const message = `Failed to add station ${Date.now() - req.startTime}ms`;
    log(message);
    res.status(500).json({
      message: message
    });
  }
};