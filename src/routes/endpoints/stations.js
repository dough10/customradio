const { validationResult } = require('express-validator');

const {stations, logger} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const blacklist = process.env.BLACKLIST?.split(',') || [];

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
module.exports = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error =  errors.array().map(e => e.msg).join(', ');
    logger.error(error);
    return res.status(400).json({error});
  }  

  const decoded = decodeURIComponent(req.query.genres);
  const genres = decoded !== 'undefined' ? decoded.split(',').map(genre => genre.toLowerCase()) : [];
  const stationData = await stations.getStationsByGenre(genres);
  
  const genreString = genres.join(',');

  if (genreString && !blacklist.includes(req.ip) && stationData.length) {
    await stations.logGenres(genreString);
  }
  req.count = stationData.length;
  res.json(stationData);
});