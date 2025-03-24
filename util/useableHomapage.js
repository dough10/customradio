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
 * Check if the URL is invalid.
 * 
 * @param {String} URL
 * 
 * @returns {Boolean}
 */
function isInvalidURL(URL) {
  const invalidURLs = ['N/A', 'http://localhost/', 'http://localhost', 'url', '(NULL)', 'Unknown'];
  const regexInvalidUrl = /^https?:\/\/(?:www\.)?$/;
  return invalidURLs.includes(URL) || regexInvalidUrl.test(URL);
}

/**
 * Ensure the URL has a protocol.
 * 
 * @param {String} URL
 * 
 * @returns {String}
 */
function ensureProtocol(URL) {
  if (!URL.startsWith('http://') && !URL.startsWith('https://')) {
    return `http://${URL}`;
  }
  return URL;
}

/**
 * Parse the hostname into subdomain, domain, and extension.
 * 
 * @param {String} hostname
 * 
 * @returns {Object}
 */
function parseHostname(hostname) {
  const splitHostname = hostname ? hostname.split('.') : [];
  let subdomain, domain, ext;

  if (splitHostname.length > 2) {
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

  return { subdomain, domain, ext };
}

/**
 * Breaks a URL into parts to be restructured.
 * 
 * @param {String} URL 
 * 
 * @returns {Object|null}
 */
function urlDeconstruction(URL) {
  if (typeof URL !== 'string' || isInvalidURL(URL)) return null;

  URL = ensureProtocol(URL);

  try {
    const parsedUrl = url.parse(URL, true);
    const { subdomain, domain, ext } = parseHostname(parsedUrl.hostname);
    const ip = isIPv4(parsedUrl.hostname) ? parsedUrl.hostname : null;

    return {
      protocol: parsedUrl.protocol || 'http:',
      slashes: parsedUrl.slashes || true,
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

  if (!obj.domain && !obj.ip) return null;

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
module.exports = (homepage) => {
  if (!homepage) return null;
  const brokenHome = urlDeconstruction(homepage);
  if (brokenHome) {
    return objectToUrl(brokenHome);
  } else {
    return null;
  }
};