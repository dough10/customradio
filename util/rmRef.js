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
  const parsedUrl = url.parse(URL);
  let queryParams = querystring.parse(parsedUrl.query);
  delete queryParams['ref'];
  const newQueryString = querystring.stringify(queryParams);
  newURL = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}?${newQueryString}`;
  if (newURL.endsWith("?")) {
    newURL = newURL.slice(0, -1);
  }
  return newURL;
}
