const Stations = require('../../model/Stations');
const UserData = require('../../model/UserData.js');
const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const DB_FILE = 'data/customradio.db';

const blacklist = process.env.BLACKLIST?.split(',') || [];

module.exports = async (req, res) => {
  const userSql = new UserData(DB_FILE);
  const stationsSql = new Stations(DB_FILE);

  const state = req.query.state === '1' ? 1 : 0;
  
  const userID = req.user ? req.user.id : null;
  const stationID = req.params.id;

  if (!userID) {
    res.status(204).send();
    return;
  }

  if (!stationID || isNaN(stationID)) {
    res.status(400).send('Invalid station data');
    return;
  }

  try {
    if (state) {
      !blacklist.includes(req.ip) ? await stationsSql.addToList(stationID) : null;
      await userSql.addStation(userID, stationID);
    } else {
      await stationsSql.removeFromList(stationID);
      await userSql.removeStation(userID, stationID);
    }
    res.status(204).send();
  } catch(e) {
    log.error(`Error initializing database connections: ${e.message}`);
    res.status(500).send('Internal Server Error');
    return;
  } finally {
    await userSql.close();
    await stationsSql.close();
  }
};