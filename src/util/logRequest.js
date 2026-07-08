const UAParser = require('ua-parser-js');

const { mongo, logger } = require('../services.js');
const requestString = require('./requestString.js');
const parsePath = require('./parsePath.js');
const maskIP = require('./maskIP.js');

const DEFAULT = {
  statusCode: 444,
  getHeader: _ => null
}

module.exports = function logRequest(req, res=DEFAULT, ms) {
  const uaParser = new UAParser(req.headers['user-agent']);

  // create new request object with masked ip address 
  const newReq = {...req, ip: maskIP(req.ip)};
  
  // create variables
  const { ip, method, originalUrl } = newReq;
  const { path, query } = parsePath(originalUrl);
  
  // log in mognodb
  mongo.logRequest(ip, method, path, query, res.statusCode, uaParser.getResult(), ms)
    .catch(err => logger.error(`Failed to log request: ${err}`));
  
  // application logger
  logger.info(requestString(newReq, res, ms));
}