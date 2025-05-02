const crypto = require('crypto');

/**
 * Creates a secure hash of IP and user agent to track requests
 * @param {string} ip - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {string} Secure hash of client identifiers
 */
function createRequestHash(ip, userAgent) {
  const data = `${ip}-${userAgent}`;
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

module.exports = createRequestHash;