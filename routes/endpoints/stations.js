const { validationResult } = require('express-validator');
const he = require('he');


const saveToCollection = require('../../util/saveToCollection.js');
const queryString = require('../../util/queryString.js');
const Logger = require('../../util/logger.js');
const Stations = require('../../model/Stations.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * Handles the request to fetch and return a list of audio stations based on query parameters.
 * 
 * This function validates the incoming request, processes the genres from the query parameters, 
 * queries the SQLite database for audio stations that match the specified genres and are currently online,
 * and then returns the results in the response. It handles errors gracefully and provides appropriate HTTP status codes.
 * 
 * @async
 * @function
 * 
 * @param {Object} req - The HTTP request object containing query parameters and other request data.
 * @param {Object} req.query - The query parameters of the request.
 * @param {string} req.query.genres - A comma-separated list of genres to filter the stations by.
 * @param {Object} res - The HTTP response object used to send the results or error messages.
 * 
 * @returns {Promise<void>} A promise that resolves when the response has been sent.
 * 
 * @throws {Error} Throws an error if the database query fails or if there's a problem with the request handling.
 * 
 * @example
 * 
 * app.get('/stations', (req, res) => {
 *   getStations(req, res)
 *     .then(() => {
 *       // Response is sent from within getStations
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
    const error =  errors.array().map(e => e.msg).join(', ');
    log.error(error);
    return res.status(400).json({error});
  }  
  const sql = new Stations('data/customradio.db');
  try {
    const genres = decodeURIComponent(req.query.genres).split(',').map(genre => he.decode(genre).toLowerCase());
    const stations = await sql.getStationsByGenre(genres);
    
    const genreString = genres.join(',');

    if (genreString) {
      log.debug(`Saving genres: ${genreString}`);
      await saveToCollection({ 
        genres: genreString, 
        time: new Date().getTime() 
      }, 'genres');
    }

    log.info(`${req.ip} -> /stations${queryString(genreString)} ${stations.length} stations returned ${Date.now() - req.startTime}ms`);
    res.json(stations);
  } catch (err) {
    const error = `Error fetching stations: ${err.message}`;
    log.error(error);
    res.status(500).json({error});
  } finally {
    await sql.close();
  }
};