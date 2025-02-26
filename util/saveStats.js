const Logger = require('./logger.js');
const saveToCollection = require('./saveToCollection.js');

const log = new Logger('info');

module.exports = async (stats) => {
  await saveToCollection(stats, 'statistics');
  log.info('database statistics saved');
};