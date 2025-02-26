const Logger = require('./logger.js');
const saveToCollection = require('./saveToCollection.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = async (stats) => {
  await saveToCollection(stats, 'statistics');
  log.debug('database statistics saved');
};