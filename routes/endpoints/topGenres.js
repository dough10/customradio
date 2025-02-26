require('dotenv').config();

const DbConnector = require('../../util/dbConnector.js');

const Logger = require('../../util/logger.js');

const log = new Logger('info');

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
module.exports = async (redis, req, res) => {
  const cacheKey = `genres`;

  try {
    const genresCache = await redis.get(cacheKey);

    if (genresCache) {
      const cachedGenres = JSON.parse(genresCache);
      res.set('content-type', 'application/json');
      return res.send(cachedGenres);
    }
  } catch (error) {
    log.error('(╬ Ò﹏Ó) Error fetching cached genres:', error);
    return res.status(500).json({
      error: 'Failed to fetch cached genres (╬ Ò﹏Ó)'
    });
  }


  const url = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';
  const connector = new DbConnector(url, 'genres');
  const db = await connector.connect();
  try{
    const topGenres = await db.aggregate([
      {
        $match: {
          time: { $gt: new Date().getTime() - 1296000000 }
        }
      },
      {
        $group: {
          _id: "$genres",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();
    const genreObj = topGenres.map(obj => obj._id).sort((a, b) => a.localeCompare(b));
    res.json(genreObj);
    await redis.set(cacheKey, JSON.stringify(genreObj), 'EX', 3600);
  } catch(error) {
    log.error('Error getting genres', error.message);
    res.status(500).json({
      error: `Error getting genres ${error.message}`
    });
  } finally {
    await connector.disconnect();
  }
};