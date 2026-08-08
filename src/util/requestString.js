const msToHhMmSs = require('./msToHhMmSs.js');

// const isAdmin = require('./isAdmin.js');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }

  return `${Number(value.toFixed(1))} ${units[i]}`;
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
  
  const parts = [
    `${ip} -> [${method}] ${originalUrl}`,
    `status: ${res.statusCode}`
  ];

  const contentType = res.getHeader('Content-Type');
  if (contentType != null) parts.push(`type: ${contentType}`);

  const contentLength = res.getHeader("Content-Length");
  if (contentLength != null) {
    parts.push(`bytes: ${formatBytes(Number(contentLength))}`);
  }

  if (ms != null) {
    parts.push(ms < 10000 ? `time: ${ms} ms` : `time: ${msToHhMmSs(ms)}`);
  }

  // if (user) {
  //   [
  //     `user: ${user.id.replace('user_', '')}`,
  //     `admin: ${isAdmin(req)}`
  //   ].forEach(str => parts.push(str));
  // }

  if (loadedLang) parts.push(`lang: ${loadedLang}`);

  if (count !== undefined) {
    parts.push(`count: ${count}`);
  }

  if (body && Object.keys(body).length) {
    const json = JSON.stringify(body);
    parts.push(`body: ${json.length > 500 ? json.slice(0, 500) + "..." : json}`);
  }

  return parts.join(', ');
}