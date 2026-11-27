
const { logger } = require('../services.js');

const pack = require('../../package.json');
const { EnvHttpProxyAgent } = require('undici');

const isValidURL = require('./isValidURL.js');
const fixEncoding = require('./fixEncoding.js');
const usedTypes = require('./usedTypes.js');
const rmRef = require('./rmRef.js');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const unhelpfulNames = [
  'null',
  '(null)',
  'stream',
  '.',
  ':',
  '-',
  'no name',
  'radio',
  'online radio',
  'n/a',
  'this is my server name'
];

const unhelpfulRegex = /^\d{1,2}$/;

const defaultPorts = [':80/', ':443/'];

const requestHeaders = {
  'User-Agent': `radiotxt.site/${pack.version}`,
  'Accept': 'audio/*, */*;q=0.9',
  'Icy-MetaData': '1',
  'Range': 'bytes=0-'
};

// -----------------------------------------------------------------------------
// URL helpers
// -----------------------------------------------------------------------------

/**
 * Clean the URL by removing default ports and trailing question marks.
 *
 * @param {string} url
 * @returns {string}
 */
function cleanURL(url) {
  if (url.endsWith('?')) {
    url = url.slice(0, -1);
  }

  defaultPorts.forEach((port) => {
    url = url.replace(port, '/');
  });

  return rmRef(url);
}

// -----------------------------------------------------------------------------
// Error helpers
// -----------------------------------------------------------------------------

/**
 * Create a standardized error response.
 *
 * @param {string} message
 * @param {number} status
 * @returns {Object}
 */
function returnError(message, status) {
  return {
    ok: false,
    error: message,
    status
  };
}

/**
 * Convert fetch errors into the existing error response format.
 *
 * @param {Error} error
 * @returns {Object}
 */
function handleFetchError(error) {
  if (
    error?.name === 'TimeoutError' ||
    error?.name === 'AbortError'
  ) {
    return returnError('timeout', 500);
  }

  if (error?.cause?.code === 'ENOTFOUND') {
    return returnError('dns_failure', 500);
  }

  if (error?.cause?.code === 'ECONNREFUSED') {
    return returnError('connection_refused', 500);
  }

  return returnError(
    error?.message || 'fetch_failed',
    500
  );
}

// -----------------------------------------------------------------------------
// Request helpers
// -----------------------------------------------------------------------------

/**
 * Create an HTTP proxy dispatcher.
 *
 * @returns {EnvHttpProxyAgent}
 */
function createDispatcher() {
  return new EnvHttpProxyAgent({
    connections: 1
  });
}

/**
 * Execute the stream request.
 *
 * @param {string} url
 * @param {AbortSignal} signal
 * @param {EnvHttpProxyAgent} dispatcher
 * @returns {Promise<Response>}
 */
function fetchStream(url, signal, dispatcher) {
  return fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: requestHeaders,
    signal,
    dispatcher
  });
}

// -----------------------------------------------------------------------------
// Response helpers
// -----------------------------------------------------------------------------

/**
 * Handle HTTP redirects without following them.
 *
 * @param {Response} response
 * @param {string} url
 * @returns {Object|null}
 */
function handleRedirect(response, url) {
  if (
    response.status < 300 ||
    response.status >= 400
  ) {
    return null;
  }

  return {
    ok: false,
    error: 'redirect',
    status: response.status,
    redirect: response.headers.get('location') || null,
    url
  };
}

/**
 * Validate the HTTP response status.
 *
 * @param {Response} response
 * @returns {Object|null}
 */
function validateResponse(response) {
  if (!response.ok) {
    return returnError(
      `http_${response.status}`,
      response.status
    );
  }

  if (!response.body) {
    return returnError(
      'no_response_body',
      response.status
    );
  }

  return null;
}

/**
 * Validate the response content type.
 *
 * @param {Response} response
 * @returns {Object|null}
 */
function validateContentType(response) {
  const content = response.headers.get('content-type');

  const normalizedContent = content
    ?.split(';')[0]
    .trim()
    .toLowerCase();

  if (!normalizedContent) {
    return returnError(
      'missing_content_type',
      response.status
    );
  }

  if (!usedTypes.includes(normalizedContent)) {
    return returnError(
      `invalid content-type: ${content}`,
      response.status
    );
  }

  return null;
}

// -----------------------------------------------------------------------------
// Metadata helpers
// -----------------------------------------------------------------------------

/**
 * Extract and validate the stream bitrate.
 *
 * @param {Headers} headers
 * @returns {number}
 */
function getBitrate(headers) {
  let bitrate = parseInt(
    headers.get('icy-br'),
    10
  );

  if (!Number.isFinite(bitrate)) {
    bitrate = 0;
  }

  if (
    bitrate > 0 &&
    (bitrate < 8 || bitrate > 512)
  ) {
    bitrate = 0;
  }

  return bitrate;
}

/**
 * Extract and normalize the stream genre.
 *
 * @param {Headers} headers
 * @returns {string}
 */
function getGenre(headers) {
  let icyGenre =
    headers.get('icy-genre') ||
    headers.get('x-audiocast-genre') ||
    'Unknown';

  if (['null', '(null)'].includes(icyGenre.toLocaleLowerCase())) {
    icyGenre = 'unknown';
  }

  return icyGenre;
}

/**
 * Resolve a usable stream name.
 *
 * @param {string} rawName
 * @param {string} finalUrl
 * @returns {string}
 */
function getStreamName(rawName, finalUrl) {
  const fixedName = fixEncoding(rawName);

  const cleanName =
    typeof fixedName === 'string'
      ? fixedName.trim()
      : '';

  const invalidName =
    !cleanName ||
    ['null', 'undefined', ...unhelpfulNames]
      .includes(cleanName.toLowerCase()) ||
    unhelpfulRegex.test(cleanName);

  let name;

  if (invalidName) {
    try {
      name = new URL(finalUrl).hostname;
    } catch {
      name = finalUrl;
    }
  } else {
    name = cleanName;
  }

  if (!name || name === 'null') {
    logger.warn(
      `Stream missing/invalid name; using hostname. URL: ${finalUrl}, rawName: ${JSON.stringify(rawName)}`
    );
  }

  return name;
}

/**
 * Extract stream metadata from the response.
 *
 * @param {Response} response
 * @param {string} originalUrl
 * @returns {Object}
 */
function getStreamMetadata(response, originalUrl) {
  const headers = response.headers;

  const rawName =
    headers.get('icy-name') ||
    headers.get('x-audiocast-name') ||
    '';

  const description =
    headers.get('icy-description') || '';

  const content =
    headers.get('content-type');

  const icyurl =
    headers.get('icy-url') || '';

  const finalUrl = response.url || originalUrl;

  return {
    ok: true,
    url: finalUrl,
    name: getStreamName(rawName, finalUrl),
    description: fixEncoding(description),
    icyurl,
    isLive: true,
    icyGenre: getGenre(headers),
    content,
    bitrate: getBitrate(headers),
    error: '',
    status: response.status
  };
}

// -----------------------------------------------------------------------------
// Cleanup
// -----------------------------------------------------------------------------

/**
 * Cancel the response body and close the dispatcher.
 *
 * @param {Response|null} response
 * @param {EnvHttpProxyAgent} dispatcher
 */
async function cleanupRequest(response, dispatcher) {
  /*
   * The headers are enough to classify the response;
   * cancel the body without buffering audio data.
   */
  if (response?.body) {
    try {
      await response.body.cancel();
    } catch {
      // Response may already be closed/aborted.
    }
  }

  await dispatcher.close();
}

// -----------------------------------------------------------------------------
// Stream test
// -----------------------------------------------------------------------------

/**
 * Test whether a URL is an audio stream.
 *
 * @param {string} url
 * @param {number} timeout
 * @returns {Promise<Object>}
 */
async function streamTest(url, timeout = 10_000) {
  const signal = AbortSignal.timeout(timeout);
  const dispatcher = createDispatcher();

  let response = null;

  try {
    response = await fetchStream(
      url,
      signal,
      dispatcher
    );

    const redirectResult = handleRedirect(
      response,
      url
    );

    if (redirectResult) {
      return redirectResult;
    }

    const responseError = validateResponse(response);

    if (responseError) {
      return responseError;
    }

    const contentError = validateContentType(response);

    if (contentError) {
      return contentError;
    }

    return getStreamMetadata(response, url);

  } catch (error) {
    return handleFetchError(error);

  } finally {
    await cleanupRequest(
      response,
      dispatcher
    );
  }
}

// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

module.exports = async (url, timeout = 10_000) => {
  if (
    !url ||
    typeof url !== 'string' ||
    !isValidURL(url)
  ) {
    return {
      ok: false,
      error: `url must be a string with a valid URL format: ${url}`
    };
  }

  url = cleanURL(url);

  /*
   * Try HTTPS first for HTTP URLs.
   *
   * If HTTPS fails, fall back to the original HTTP URL.
   */
  if (url.startsWith('http://')) {
    const httpsUrl =
      url.replace(/^http:\/\//i, 'https://');

    const httpsResult = await streamTest(
      httpsUrl,
      timeout
    );

    if (httpsResult?.ok) {
      return httpsResult;
    }

    const httpResult = await streamTest(
      url,
      timeout
    );

    if (httpResult?.ok) {
      return httpResult;
    }

    return {
      ...httpResult,
      httpsError: httpsResult?.error
    };
  }

  return streamTest(url, timeout);
};
