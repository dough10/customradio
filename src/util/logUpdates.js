const plural = require('./plural.js');

const DatabaseUpdater = require('../util/DatabaseUpdater.js');
const Logger = require('../util/logger.js');

module.exports = (updater, logger) => {
  if (!(updater instanceof DatabaseUpdater)) throw new TypeError('updater must be an instance of DatabaseUpdater class');
  if (!(logger instanceof Logger)) throw new TypeError('logger must be an instance of Logger class');
  
  updater.on('start', ({ started }) => {
    logger.info(`Starting database update at ${new Date(started).toISOString()}`);
  });

  updater.on('stationUnchanged', ({ id, duration }) => {
    logger.debug(`[${id}] unchanged ${duration}ms`);
  });

  updater.on('stationUpdated', ({ id, duration }) => {
    logger.debug(`[${id}] updated ${duration}ms`);
  });

  updater.on('stationError', ({ id, error, duration }) => {
    logger.error(`[${id}] error: ${error} ${duration}ms`);
  });

  updater.on('done', ({ updated, duration, end }) => {
    logger.info(`Update complete: ${updated} entr${plural(updated)} updated in ${duration}.`);
    logger.info(`Stats - Total: ${end.total}, Online: ${end.online}, Offline: ${end.total - end.online}`);
  });

};