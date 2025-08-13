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

  const user = req.user ? req.user.id : null;
  
  const state = req.params.state === '1' ? 1 : 0;

  const station = req.body;

  if (!user) {
    res.status(401).send('Unauthorized');
    return;
  }

  if (!station || typeof station.id === 'undefined' || typeof station.url !== 'string') {
    res.status(400).send('Invalid station data');
    return;
  }

  try {
    if (state) {
      !blacklist.includes(req.ip) ? await stationsSql.addToList(station.id) : null;
      await userSql.saveStation(user, station);
    } else {
      await stationsSql.removeFromList(station.id);
      await userSql.removeStation(user, station.url);
    }
    res.json({ state });
  } catch(e) {
    log.error(`Error initializing database connections: ${e.message}`);
    res.status(500).send('Internal Server Error');
    return;
  } finally {
    await userSql.close();
    await stationsSql.close();
  }
};