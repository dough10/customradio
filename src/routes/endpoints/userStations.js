const UserData = require('../../model/UserData.js');
const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * Fetches user-specific audio stations from the database.
 * 
 * @async
 * @function
 * @param {Object} req - The HTTP request object containing user information.
 * @param {Object} res - The HTTP response object used to send the results or error messages.
 * 
 * @returns {Promise<void>} A promise that resolves when the response has been sent.
 */
module.exports = async (req, res) => {
  const sql = new UserData('data/customradio.db');

  if (!req.user) {
    res.send([]);
    return;
  }

  try {
    const user = req.user.id;
    const stations = await sql.userStations(user);

    if (!stations || stations.length === 0) {
      res.send([]);
      return;
    }

    req.count = stations.length;
    res.json(stations);
  } catch(e) {
    log.error(`Error fetching user stations: ${e.message}`);
    res.status(500).send('Internal Server Error');
    return;
  }
  finally {
    await sql.close();
  }
};