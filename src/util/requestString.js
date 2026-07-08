const { performance } = require("perf_hooks");

// const isAdmin = require('./isAdmin.js');

function formatBytes(bytes) {
  const format = (n) => Number(n.toFixed(1));

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${format(bytes / 1024)} KB`;
  return `${format(bytes / 1024 ** 2)} MB`;
}

/**
 * generates a HTTP request string for system logger
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Number} ms 
 * 
 * @returns {String}
 */
module.exports = function requestString({
  ip,
  method,
  originalUrl,
  count,
  user,
  loadedLang,
  body,
  requestId
}, res, ms) {
  const parts = [];

  parts.push(`${ip} -> [${method}] ${originalUrl}`);

  // if (user) {
  //   [
  //     `user: ${user.id.replace('user_', '')}`,
  //     `admin: ${isAdmin(req)}`
  //   ].forEach(str => parts.push(str));
  // }

  if (count !== undefined) {
    parts.push(`count: ${count}`);
  }

  if (loadedLang) parts.push(`lang: ${loadedLang}`);

  if (body && Object.keys(body).length > 0) {
    parts.push(`body: ${JSON.stringify(body)}`);
  }

  parts.push(`status: ${res.statusCode}`);

  const contentType = res.getHeader('Content-Type');
  if (contentType) parts.push(`type: ${contentType}`);

  const contentLength = res.getHeader('Content-Length');
  if (contentLength) parts.push(`bytes: ${formatBytes(contentLength)}`);

  // if (requestId) parts.push(`request-id: ${requestId}`);

  if (ms) parts.push(`ms: ${ms}`);

  return parts.join(', ');
}