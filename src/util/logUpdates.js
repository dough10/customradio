const plural = require('./plural.js');

module.exports = (updater, logger) => {

  updater.on('start', ({ started }) => {
    logger.info(`Starting database update at ${new Date(started).toISOString()}`);
  });

  updater.on('stationUnchanged', ({ id, url, duration }) => {
    logger.debug(`[${id}] ${url} unchanged ${duration} ms`);
  });

  updater.on('stationUpdated', ({ id, url, duration }) => {
    logger.debug(`[${id}] ${url} updated ${duration} ms`);
  });

  updater.on('stationError', ({ id, url, error, duration }) => {
    logger.error(`[${id}] ${url} error: ${error} ${duration} ms`);
  });

  updater.on('done', ({ updated, duration, end }) => {
    logger.info(`Update complete: ${updated} entr${plural(updated)} updated in ${duration}.`);
    logger.info(`Stats - Total: ${end.total}, Online: ${end.online}, Offline: ${end.total - end.online}`);
  });

};