const url = require('url');

/**
 * Check for IPv4 address.
 * 
 * @param {String} address
 * 
 * @returns {Boolean}
 */
function isIPv4(address) {
  const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Pattern.test(address);
}

/**
 * Breaks a URL into parts to be restructured.
 * 
 * @param {String} URL 
 * 
 * @returns {Object|null}
 */
function urlDeconstruction(URL) {
  if (typeof URL !== 'string') return null;

  const invalidURLs = ['N/A', 'http://localhost/', 'http://localhost', 'url', '(NULL)', 'Unknown'];
  if (invalidURLs.includes(URL)) return null;

  const regexInvalidUrl = /^https?:\/\/(?:www\.)?$/;
  if (regexInvalidUrl.test(URL)) return null;

  try {
    const parsedUrl = url.parse(URL, true);
    const splitHostname = parsedUrl.hostname ? parsedUrl.hostname.split('.') : [];
    let subdomain, domain, ext, ip;

    if (isIPv4(parsedUrl.hostname)) {
      ip = parsedUrl.hostname;
    } else if (splitHostname.length > 2) {
      const lastTwoParts = splitHostname.slice(-2).join('.');
      if (['co.uk', 'org.uk', 'gov.uk'].includes(lastTwoParts)) {
        domain = splitHostname.slice(0, -2).join('.');
        ext = lastTwoParts;
      } else {
        subdomain = splitHostname[0];
        domain = splitHostname[1];
        ext = splitHostname[2];
      }
    } else if (splitHostname.length === 2) {
      domain = splitHostname[0];
      ext = splitHostname[1];
    }

    return {
      protocol: parsedUrl.protocol || 'http:',
      slashes: parsedUrl.slashes,
      ip,
      subdomain,
      domain,
      ext,
      port: parsedUrl.port || null,
      hash: parsedUrl.hash || null,
      search: parsedUrl.search || null,
      query: parsedUrl.query || null,
      pathname: parsedUrl.pathname || '/'
    };
  } catch (e) {
    return null;
  }
}

/**
 * Converts a URL object back into a string.
 * 
 * @param {Object} obj
 * 
 * @returns {String}
 */
function objectToUrl(obj) {
  if (!obj) {
    return '';
  }

  const hostname = obj.ip || (obj.subdomain ? `${obj.subdomain}.` : '') + (obj.domain || '') + (obj.ext ? `.${obj.ext}` : '');

  const formattedUrl = url.format({
    protocol: obj.protocol,
    hostname: hostname,
    port: obj.port,
    pathname: obj.pathname,
    search: obj.search,
    hash: obj.hash
  });

  return formattedUrl;
}

/**
 * Attempts to reconstruct URL to a usable form.
 * 
 * @param {String} homepage
 * 
 * @returns {String|null}
 */
module.exports = async (homepage) => {
  const brokenHome = urlDeconstruction(homepage);
  if (brokenHome) {
    return objectToUrl(brokenHome);
  } else {
    return null;
  }
};