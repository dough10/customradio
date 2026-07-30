const pack = require('../../package.json');
const useableHomepage = require('./useableHomepage.js');
const { logger } = require('./../services.js');

/**
 * breaks a string into parts and attempts to get a usable url from it
 * 
 * @param {String} url
 * 
 * @returns {null|String}
 */
module.exports = async function testHomepageConnection(url) {
  const homepage = useableHomepage(url);
  if (!homepage) {
    return;
  }

  const controller = new AbortController();
  const timeout = 5000;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(homepage, {
      method: 'HEAD',
      headers: {
        'User-Agent': `radiotxt.site/${pack.version}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';

    if (
      response.status >= 200 &&
      response.status < 300 &&
      contentType.includes('text/html')
    ) {
      return homepage;
    }
    return;

  } catch (e) {
    clearTimeout(timeoutId);

    const isAbort = e.name === 'AbortError';
    logger.debug(
      `${url} failed homepage test connection: ${isAbort ? 'timeout' : e.message
      }`
    );

    return;
  }
}