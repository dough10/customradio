const axios = require('axios');
const pack = require('../../package.json');

const isValidURL = require('./isValidURL.js');
const Logger = require('./logger.js');
const retry = require('./retry.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * An array containing default port numbers used in network protocols.
 * 
 * @constant {string[]} defaultPorts
 * @default
 * @example
 * // Accessing the default ports
 * console.log.info(defaultPorts[0]); // Output: ':80/'
 * console.log.info(defaultPorts[1]); // Output: ':443/'
 */
const defaultPorts = [
  ':80',
  ':443'
];

/**
 * Clean the URL by removing default ports and trailing question marks.
 * 
 * @param {string} url - The URL to clean.
 * 
 * @returns {string} The cleaned URL.
 */
function cleanURL(url) {
  if (url.endsWith("?")) {
    url = url.slice(0, -1);
  }
  defaultPorts.forEach(port => {
    url = url.replace(port, '');
  });
  return url;
}

/**
 * Tests if the provided URL is an audio stream and retrieves related information.
 *
 * This function sends a HEAD request to the given URL to check if it is a live audio stream
 * by inspecting the response headers. It checks for audio-related headers and parses them,
 * returning an object with stream details if the URL points to a valid audio stream.
 *
 * @param {string} url - The URL to be tested for streaming.
 * 
 * @returns {Promise<Object|boolean>} Returns a promise that resolves to an object containing
 * stream information (if the URL is an audio stream) or `false` if it is not an audio stream
 * or if an error occurs.
 * @returns {Object} - The returned object contains:
 *   @property {string} url - The URL that was tested.
 *   @property {string} [name='Unknown'] - The name of the stream, or 'Unknown' if not available.
 *   @property {boolean} isLive - Indicates if the stream is live (i.e., responds with status 200).
 *   @property {string} [icyGenre='Unknown'] - The genre of the stream, or 'Unknown' if not available.
 *   @property {string} content - The content type of the stream (e.g., 'audio/mp3').
 *   @property {number|string} [bitrate='Unknown'] - The bitrate of the stream, or 'Unknown' if not available.
 * 
 * @throws {Error} Throws an error if the HTTP request fails or if there is an issue with the URL.
 */
async function streamTest(url) {
  try {
    const response = await axios.head(url, {
      headers: {
        'User-Agent': `radiotxt.site/${pack.version}`
      },
      timeout: 1500
    });
    const isLive = response.status >= 200 && response.status < 300;
    let name = response.headers['icy-name'];
    const description = response.headers['icy-description'];
    const icyGenre = response.headers['icy-genre'];
    let bitrate = response.headers['icy-br'];
    const content = response.headers['content-type'];
    const icyurl = response.headers['icy-url'];
    const isAudioStream = content && content.startsWith('audio/');

    if (!isAudioStream) {
      const errorMessage = `Test error: ${url} - invalid content-type: ${content}`;
      log.debug(errorMessage);
      return {
        ok: false,
        error: errorMessage
      };
    }

    if (bitrate && bitrate.length > 3) bitrate = bitrate.split(',')[0];
    bitrate = Number(bitrate);
    if (isNaN(bitrate)) bitrate = 'Unknown';

    // set name to homepage if no name is found
    if (!name && icyurl || name && name.length <= 1 && icyurl) {
      name = icyurl;
    }

    return {
      ok: true,
      url,
      name,
      description,
      icyurl,
      isLive,
      icyGenre,
      content,
      bitrate: Number(bitrate),
      error: ''
    };
  } catch (error) {
    const errorMessage = `Test failed: ${url} - ${error.message}`;
    log.debug(errorMessage);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Checks if the provided URL is a live stream and retrieves its metadata.
 * 
 * This function attempts to send a HEAD request to the URL (or its HTTPS equivalent) to determine if the stream is live.
 * It extracts metadata such as the stream's name, genre, bitrate, and content type from the response headers.
 * If the request fails or the URL does not point to a live stream, it returns `false`.
 * 
 * @async
 * @function
 * 
 * @param {string} url - The URL of the stream to check.
 * 
 * @returns {Promise<Object|boolean>} A promise that resolves to an object containing the stream's metadata if live,
 * or `false` if the stream is not live or if an error occurs. The object has the following properties:
 *   - {string} url - The URL of the stream.
 *   - {boolean} isLive - Whether the stream is currently live.
 *   - {string} [name] - The name of the stream (if available).
 *   - {string} [icyGenre] - The genre of the stream (if available).
 *   - {string} [bitrate] - The bitrate of the stream (if available).
 *   - {string} [content] - The content type of the stream (if available).
 * 
 * @throws {Error} Throws an error if the request fails or if there are issues processing the URL.
 * 
 * @example
 * 
 * isLiveStream('http://example.com/stream')
 *   .then(data => {
 *     if (data) {
 *       console.log.info('Stream is live:', data);
 *     } else {
 *       console.log.info('Stream is not live or an error occurred');
 *     }
 *   })
 *   .catch(err => {
 *     console.error('Error checking stream:', err);
 *   });
 */
module.exports = async (url) => {
  if (!url || typeof url !== 'string' || !isValidURL(url)) {
    return {
      ok: false,
      error: `url must be a string with a valid URL format: ${url}`
    };
  }

  url = cleanURL(url);

  // Always test HTTPS first
  if (url.startsWith('http://')) {
    const httpsUrl = url.replace('http://', 'https://');
    try {
      return await retry(() => streamTest(httpsUrl));
    } catch (error) {
      log.error(`HTTPS test failed for ${httpsUrl}: ${error.message}`);
      log.debug(`Falling back to HTTP: ${url}`);
    }
  }

  try {
    return await retry(() => streamTest(url));
  } catch(e) {
    log.error(`Failed testing http: ${e.message}`);
  }
};
