const Stations = require('./model/Stations.js');
const UserData = require('./model/UserData.js');
const Alerts = require('./model/Alerts.js');
const Logger = require('./util/logger.js');

const DB_PATH = 'data/customradio.db';

const logLevel = process.env.LOG_LEVEL || 'info';
const logger = new Logger(logLevel);

const stations = new Stations(DB_PATH);
const userData = new UserData(DB_PATH);
const alerts = new Alerts(DB_PATH)

module.exports = {
  stations,
  userData,
  alerts,
  logger,
  logLevel
}