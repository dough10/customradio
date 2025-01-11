const url = require('url');

/**
 * check for ip address
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
 * breaks a URL into parts to be restructured
 * 
 * @param {String} URL 
 * 
 * @returns {Object}
 */
function urlDeconstruction(URL) {
  if (typeof URL !== 'string') return null;

  if (URL === 'N/A' || URL === 'http://localhost/' || URL === 'http://localhost' || URL === 'url' || URL === '(NULL)') return null;

  if (URL.startsWith('ttps://')) {
    URL = 'https://' + URL.slice(5);
  }

  const regexInvalidUrl = /^https?:\/\/(?:www\.)?$/;
  if (regexInvalidUrl.test(URL)) {
    return null;
  }

  try {
    const parsedUrl = url.parse(URL, true);

    const splitHostname = parsedUrl.hostname ? parsedUrl.hostname.split('.') : [];
    let subdomain, domain, ext, ip;

    if (isIPv4(parsedUrl.hostname)) {
      ip = parsedUrl.hostname;
    } else if (splitHostname.length > 2) {
      subdomain = splitHostname[0];
      domain = splitHostname[1];
      ext = splitHostname[2];
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
 * url object back into a string
 * 
 * @param {Object} obj
 * 
 * @returns {String}
 */
function objectToUrl(obj) {
  if (!obj) {
    return '';
  }

  const protocol = obj.protocol || 'http:';
  const subdomain = obj.subdomain ? `${obj.subdomain}.` : '';
  const domain = obj.domain || obj.ip || '';
  const ext = obj.ext ? `.${obj.ext}` : '';
  const port = obj.port ? `:${obj.port}` : '';
  const pathname = obj.pathname || '/';
  const search = obj.search ? `?${obj.search}` : '';
  const hash = obj.hash ? `#${obj.hash}` : '';

  return `${protocol}//${subdomain}${domain}${ext}${port}${pathname}${search}${hash}`;
}

/**
 * attempts to reconstruct url to a usable form
 * 
 * @param {Object} obj
 *  
 * @returns {String} 
 */
module.exports = async (obj) => {
  const brokenHome = urlDeconstruction(obj.homepage);
  if (brokenHome) {
    return objectToUrl(brokenHome);
  } else {
    return 
  }
};