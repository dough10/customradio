const Stations = require('./model/Stations.js');
const UserData = require('./model/UserData.js');
const Logger = require('./util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const logger = new Logger(logLevel);

const stations = new Stations('data/customradio.db');
const userData = new UserData('data/customradio.db');

module.exports = {
  stations,
  userData,
  logger
}