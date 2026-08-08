const plural = require('./plural.js');

const IcecastDBScraper = require('./IcecastDBScraper.js');
const Logger = require('../util/logger.js');
const Mongo = require('../model/Mongo.js');

/**
 * adds listeners to database updater events, log start, done and station changes and errors
 * 
 * @param {DatabaseUpdater} scraper 
 * @param {Logger} logger 
 */
module.exports = (scraper, logger, mongo) => {
  if (!(scraper instanceof IcecastDBScraper)) throw new TypeError('updater must be an instance of IcecastDBScraper class');
  if (!(logger instanceof Logger)) throw new TypeError('logger must be an instance of Logger class');
  if (!(mongo instanceof Mongo))  throw new TypeError('mongo must be an instance of Mongo class');
  
  scraper.on('start', ({ started, total }) => {
    logger.info(`Starting IcecastDB scrape ${total} stations pulled at ${new Date(started).toISOString()}`);
  });

  scraper.on('stationAdded', ({ id, duration }) => {
    logger.debug(`[${id}] added ${duration}ms`);
  });

  scraper.on('stationError', ({ id, error, duration }) => {
    logger.error(`[${id}] error: ${error} ${duration}ms`);
  });

  scraper.on('done', ({ changed, duration, end }) => {
    logger.info(`Scrape complete: ${changed} entr${plural(changed)} added in ${duration}.`);
    logger.info(`Stats - Total: ${end.total}, Online: ${end.online}, Offline: ${end.total - end.online}`);
  });

  scraper.on('error', error => mongo.logJSError(error));
};