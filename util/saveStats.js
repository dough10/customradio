const log = require('./log.js');
const saveToCollection = require('./saveToCollection.js');

module.exports = async (stats) => {
  await saveToCollection(stats, 'statistics');
  log('database statistics saved');
};