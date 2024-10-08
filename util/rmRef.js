const url = require('url');

/**
 * remove "ref" query parameter
 * 
 * @param {String} URL 
 * 
 * @returns {String} url without ref query paramater
 */
module.exports = (urlString) => {
  const parsedUrl = url.parse(urlString, true);
  delete parsedUrl.query.ref;
  return url.format({
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    pathname: parsedUrl.pathname,
    query: parsedUrl.query,
  });
};