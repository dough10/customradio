module.exports = rmRef;

const url = require('url');

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

function isIPv4(address) {
  const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Pattern.test(address);
}

function urlDeconstruction(URL) {
  const parsedUrl = url.parse(URL);

  const splitHostname = parsedUrl.hostname.split('.');
  let subdomain;
  let domain;
  let ext;
  let ip;

  if (isIPv4(parsedUrl.hostname)) {
    ip = parsedUrl.hostname
  } else if (splitHostname.length > 2) {
    subdomain = splitHostname[0];
    domain = splitHostname[1];
    ext = splitHostname[2];
  } else {
    domain = splitHostname[0];
    ext = splitHostname[1];
  }

  return {
    protocol: parsedUrl.protocol,
    slashes: parsedUrl.slashes,
    ip,
    subdomain,
    domain,
    ext,
    port: parsedUrl.port,
    hash: parsedUrl.hash,
    search: parsedUrl.search,
    query: parsedUrl.query,
    pathname: parsedUrl.pathname
  };

}