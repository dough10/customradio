const { validationResult } = require('express-validator');
const he = require('he');

const usedTypes = require("../../util/usedTypes.js");
const queryString = require('../../util/queryString.js');
const saveToCollection = require('../../util/saveToCollection.js');
const Logger = require('../../util/logger.js');

const log = new Logger('info');

/**
 * Handles the request to fetch and return a list of audio stations based on query parameters.
 * 
 * This function validates the incoming request, processes the genres from the query parameters, 
 * queries the MongoDB database for audio stations that match the specified genres and are currently online,
 * and then returns the results in the response. It handles errors gracefully and provides appropriate HTTP status codes.
 * 
 * @async
 * @function
 * 
 * @param {Object} db - The MongoDB database object used to query the stations.
 * @param {Object} redis - The redis cache server instance 
 * @param {Object} req - The HTTP request object containing query parameters and other request data.
 * @param {Object} res - The HTTP response object used to send the results or error messages.
 * 
 * @returns {Promise<void>} A promise that resolves when the response has been sent.
 * 
 * @throws {Error} Throws an error if the database query fails or if there's a problem with the request handling.
 * 
 * @example
 * 
 * app.get('/stations', (req, res) => {
 *   getStations(db, redis, req, res)
 *     .then(() => {
 *       // Response is sent from within getStations
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

  const genres = decodeURIComponent(req.query.genres).split(',').map(genre => he.decode(genre).toLowerCase());

  const genreString = genres.join(',');

  if (genreString) {
    await saveToCollection({ 
      genres: genreString, 
      time: new Date().getTime() 
    }, 'genres');
    try {
      const removed = await redis.del('genres');
      if (removed) log.info('genres cache deleted');
    } catch(error) {
      log.info(`error deleting genres cache: ${error.message}`);
    }
  }

  const cacheKey = `stations_${genreString}`;

  try {
    const cachedStations = await redis.get(cacheKey);

    if (cachedStations) {
      const stations = JSON.parse(cachedStations);
      res.set('content-type', 'application/json');
      log.info(`${req.ip} -> /stations${queryString(genreString)} ${stations.length} cached stations returned ${Date.now() - req.startTime}ms`);
      return res.send(stations);
    }
  } catch (error) {
    log.error('(╬ Ò﹏Ó) Error fetching cached stations:', error);
    return res.status(500).json({
      error: 'Failed to fetch cached stations (╬ Ò﹏Ó)'
    });
  }

  const searchQuery = genres.map(genre => new RegExp(genre, 'i'))

  try {
    const stations = await db.find({
      'content-type': usedTypes,
      online: true,
      bitrate: {
        $exists: true,
        $ne: null
      },
      $or: [
        {
          genre: {
            $in: searchQuery
          }
        },
        {
          name: {
            $in: searchQuery
          }
        }
      ]
    }, {
      projection: {
        _id: 0,
        name: 1,
        url: 1,
        bitrate: 1,
        genre: 1,
        icon: 1,
        homepage: 1
      }
    }).sort({
      name: 1
    }).toArray();    
    log.info(`${req.ip} -> /stations${queryString(genres.join(','))} ${stations.length} stations returned ${Date.now() - req.startTime}ms`);
    res.json(stations);
    await redis.set(cacheKey, JSON.stringify(stations), 'EX', 3600);
  } catch (err) {
    log.error('(╬ Ò﹏Ó) Error fetching stations:', err);
    res.status(500).json({
      error: 'Failed to fetch stations (╬ Ò﹏Ó)'
    });
  }
};