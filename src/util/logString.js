const { performance } = require("perf_hooks");

const maskIP = require('./maskIP.js');
const isAdmin = require('./isAdmin.js');

/**
 * generates a HTTP request string for system logger
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Number} start 
 * 
 * @returns {String}
 */
module.exports = function logString(req, res, start) {
  const parts = [];

  parts.push(`${maskIP(req.ip)} -> [${req.method}] ${req.originalUrl}`);

  if (req.user) {
    [
      `user: ${req.user.id.replace('user_', '')}`,
      `admin: ${isAdmin(req)}`
    ].forEach(str => parts.push(str));
  }

  if (req.count !== undefined) {
    parts.push(`count: ${req.count}`);
  }

  if (req.loadedLang) parts.push(`lang: ${req.loadedLang}`);

  if (req.body && Object.keys(req.body).length > 0) {
    parts.push(`body: ${JSON.stringify(req.body)}`);
  }

  parts.push(`status: ${res.statusCode}`);

  const contentType = res.getHeader('Content-Type');
  if (contentType) parts.push(`type: ${contentType}`);

  const contentLength = res.getHeader('Content-Length');
  if (contentLength) parts.push(`bytes: ${contentLength}`);

  // if (req.requestId) parts.push(`request-id: ${req.requestId}`);

  if (start) parts.push(`ms: ${(performance.now() - start).toFixed(2)}`);

  return parts.join(', ');
}