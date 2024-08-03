module.exports = addToDatabase;


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
async function addToDatabase(db, req, res) {
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
      res.json({
        message: 'station exists'
      });
      return;
    }
    const status = await isLiveStream(url);
    if (!status) {
      res.status(200).json({
        message: 'Connection test failed'
      });
      return;
    }
    const data = {
      name: status.name,
      url,
      online: status.isLive,
      genre: status.genre
    };
    await db.insertOne(data);
    res.json({
      message: "station saved o( ❛ᴗ❛ )o"
    });
  } catch (e) {
    res.status(500).json({
      message: 'Failed to add station (╬ Ò﹏Ó)'
    });
  }
}