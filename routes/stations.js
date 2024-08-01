module.exports = getStations;


const {validationResult} = require('express-validator');


const log = require('../util/log.js');
const queryString = require('../util/queryString.js');


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
 *   getStations(db, req, res)
 *     .then(() => {
 *       // Response is sent from within getStations
 *     })
 *     .catch(err => {
 *       console.error('Failed to handle request:', err);
 *       res.status(500).json({ error: 'Internal server error' });
 *     });
 * });
 */
async function getStations(db, req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    const genres = req.query.genres.split(',');
    const stations = await db.find({
      'content-type': 'audio/mpeg',
      online: true,
      genre: {
        $in: genres.map(genre => new RegExp(genre, 'i'))
      },
      bitrate: { $exists: true, $ne: null || 'Quality'}
    }, {
      projection: {
        _id: 0,
        name: 1,
        url: 1,
        bitrate: 1
      }
    }).sort({
      name: 1
    }).toArray();
    log(`${req.ip} -> /stations${queryString(genres.join(','))} ${stations.length} stations returned`);
    res.json(stations);
  } catch (err) {
    console.error('(╬ Ò﹏Ó) Error fetching stations:', err);
    res.status(500).json({
      error: 'Failed to fetch stations (╬ Ò﹏Ó)'
    });
  }
}