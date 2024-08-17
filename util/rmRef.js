module.exports = rmRef;

const url = require('url');
const querystring = require('querystring');

/**
 * remove "ref" query parameter
 * 
 * @param {String} URL 
 * 
 * @returns {String} url without ref query paramater
 */
function rmRef(URL) {
  const parsedUrl = url.parse(URL, true);
  delete parsedUrl.query.ref;
  return url.format({
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    pathname: parsedUrl.pathname,
    query: parsedUrl.query,
  });
}
