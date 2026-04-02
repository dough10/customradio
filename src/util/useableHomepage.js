const isValidURL = require('./isValidURL.js');

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
function isNotValidURL(URL) {
  if (URL.endsWith('/')) {
    URL = URL.slice(0, -1);
  }
  const invalidURLs = [
    'http://Unknown',
    'http://localhost'
  ];
  return invalidURLs.includes(URL) || !isValidURL(URL);
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
  if (!hostname) return { subdomain: null, domain: null, ext: null };

  const splitHostname = hostname.split('.');
  const length = splitHostname.length;

  const specialDomains = [
    'co.uk', 'org.uk', 'ac.uk', 'sch.uk', 'nhs.uk', 'mod.uk',
    'com.au', 'net.au', 'org.au', 'edu.au', 'asn.au', 'id.au',
    'co.nz', 'net.nz', 'org.nz', 'ac.nz', 'com.sg', 'net.sg', 
    'org.sg', 'edu.sg', 'per.sg', 'co.in', 'net.in', 'org.in', 
    'ac.in', 'res.in', 'edu.in', 'mil.in'
  ];
  const lastTwoParts = splitHostname.slice(-2).join('.');

  if (length > 2 && specialDomains.includes(lastTwoParts)) {
    const remainder = splitHostname.slice(0, -2);
    return {
      subdomain: remainder.length > 1 ? remainder[0] : null,
      domain: remainder.length > 1 ? remainder[1] : remainder[0],
      ext: lastTwoParts
    };
  }

  return {
    subdomain: length > 2 ? splitHostname[0] : null,
    domain: length > 1 ? splitHostname[length - 2] : splitHostname[0],
    ext: length > 1 ? splitHostname[length - 1] : null
  };
}

/**
 * Breaks a URL into parts to be restructured.
 * 
 * @param {String} URL 
 * 
 * @returns {Object|null}
 */
function urlDeconstruction(input) {
  if (typeof input !== 'string') return null;

  input = ensureProtocol(input);
  if (isNotValidURL(input)) return null;

  try {
    const u = new URL(input);

    const { subdomain, domain, ext } = parseHostname(u.hostname);
    const ip = isIPv4(u.hostname) ? u.hostname : null;

    const queryEntries = [...u.searchParams.entries()];
    const query = queryEntries.length
      ? Object.fromEntries(queryEntries)
      : null;

    return {
      protocol: u.protocol || 'http:',
      slashes: true,
      ip,
      subdomain,
      domain,
      ext,
      port: u.port || null,
      hash: u.hash || null,
      search: u.search || null,
      query,
      pathname: u.pathname || '/'
    };
  } catch {
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