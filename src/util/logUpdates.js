const plural = require('./plural.js');

const DatabaseUpdater = require('./DatabaseUpdater.js');
const Logger = require('../util/logger.js');
const Mongo = require('../model/Mongo.js');

/**
 * adds listeners to database updater events, log start, done and station changes and errors
 * 
 * @param {DatabaseUpdater} updater 
 * @param {Logger} logger 
 */
module.exports = (updater, logger, mongo) => {
  if (!(updater instanceof DatabaseUpdater)) throw new TypeError('updater must be an instance of DatabaseUpdater class');
  if (!(logger instanceof Logger)) throw new TypeError('logger must be an instance of Logger class');
  if (!(mongo instanceof Mongo))  throw new TypeError('mongo must be an instance of Mongo class');

  updater.on('start', ({ time }) => {
    logger.info(`Starting database update at ${new Date(time).toISOString()}`);
  });

  updater.on('stationUpdated', ({ id, duration }) => {
    logger.debug(`[${id}] updated ${duration}ms`);
  });

  updater.on('stationError', ({ id, error, duration }) => {
    logger.error(`[${id}] error: ${error} ${duration}ms`);
  });

  updater.on('error', error => mongo.logJSError(error));

  updater.on('done', ({ changed, duration, end }) => {
    logger.info(`Update complete: ${changed} entr${plural(changed)} updated in ${duration}.`);
    logger.info(`Stats - Total: ${end.total}, Online: ${end.online}, Offline: ${end.total - end.online}`);
  });

};