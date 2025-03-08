require('dotenv').config();

const Stations = require('../../model/Stations.js');

const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * Handles the request to retrieve the top genres from the database.
 *
 * This function connects to a MongoDB database, aggregates the genres,
 * and returns the top 10 genres sorted alphabetically.
 *
 * @async
 * @function
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns a promise that resolves when the response has been sent.
 * 
 * @throws {Error} Throws an error if there is an issue with the database connection
 *                 or during the aggregation process. The response will be sent with a 500 status code
 *                 and an error message.
 *
 * @example
 * // Example of calling the function
 * const express = require('express');
 * const app = express();
 * const getTopGenres = require('./path/to/your/function');
 * 
 * app.get('/topGenres', getTopGenres);
 */
module.exports = async (req, res) => {
  const sql = new Stations('data/customradio.db');
  try{
    const topGenres = await sql.topGenres();
    const genreObj = topGenres.map(obj => obj.genres).sort((a, b) => a.localeCompare(b));
    res.json(genreObj);
  } catch(err) {
    const error = `Error getting genres: ${err.message}`;
    log.critical(error);
    res.status(500).json({error});
  } finally {
    await sql.close();
  }
};