const { mongo, logger } = require('../services.js');
const requestString = require('./requestString.js');
const parsePath = require('./parsePath.js');
const maskIP = require('./maskIP.js');

const DEFAULT = {
  statusCode: 444,
  getHeader: _ => null
}

module.exports = function logRequest(req, res=DEFAULT, ms) {
  const newReq = {...req, ip: maskIP(req.ip)};
  const { ip, method, originalUrl } = newReq;
  const { path, query } = parsePath(originalUrl);
  mongo.logRequest(ip, method, path, query, res.statusCode, ms)
    .catch(err => logger.error(`Failed to log request: ${err}`));
  logger.info(requestString(newReq, res, ms));
}