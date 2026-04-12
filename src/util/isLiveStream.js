const pack = require("../../package.json");

const isValidURL = require("./isValidURL.js");
const retry = require("./retry.js");
const fixEncoding = require("./fixEncoding.js");
const {logger} = require('./../services.js');
const usedTypes = require("./usedTypes.js");

/**
 * An array of unhelpful stream names to ignore.
 *
 * @constant {string[]} unhelpfulNames
 * @default
 */
const unhelpfulNames = [
  "stream",
  ".",
  ":",
  "-",
  "no name",
  "radio",
  "online radio",
  "n/a",
  "this is my server name"
];

/**
 * An array containing default port numbers used in network protocols.
 *
 * @constant {string[]} defaultPorts
 * @default
 */
const defaultPorts = [":80/", ":443/"];

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
  defaultPorts.forEach((port) => {
    url = url.replace(port, "/");
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
 *   @property {number} [bitrate=0] - The bitrate of the stream, or 'Unknown' if not available.
 *
 * @throws {Error} Throws an error if the HTTP request fails or if there is an issue with the URL.
 */
async function streamTest(url) {
  const controller = new AbortController();
  const timeout = 4500;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "User-Agent": `radiotxt.site/${pack.version}`,
        "Accept": "*/*"
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const isLive = response.status >= 200 && response.status < 300;

    const headers = response.headers;

    let name = headers.get("icy-name");
    const description = headers.get("icy-description") || "";
    const icyGenre = headers.get("icy-genre") || "Unknown";
    let bitrate = headers.get("icy-br");
    const content = headers.get("content-type");
    const icyurl = headers.get("icy-url") || "";

    const isAudioStream = content && usedTypes.includes(content);

    if (!isAudioStream) {
      const errorMessage = `Test error: ${url} - invalid content-type: ${content}`;
      logger.debug(errorMessage);
      return {
        ok: false,
        error: errorMessage,
        status: response.status,
      };
    }

    if (bitrate) {
      bitrate = bitrate.includes(',') ? bitrate.split(',')[0] : bitrate;
      bitrate = Number(bitrate) || 0;
    }

    if (isNaN(bitrate)) bitrate = 0;

    if (name) {
      name = fixEncoding(name);
      const unhelpfulRegex = /^\d{1,2}$/;
      const cleanName = name.toLowerCase().trim();

      if (unhelpfulNames.includes(cleanName) || unhelpfulRegex.test(cleanName)) {
        name = null;
      }
    }

    if (!name) {
      name = url;
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
      bitrate,
      error: "",
      status: response.status,
    };

  } catch (error) {
    clearTimeout(timeoutId);

    const isAbort = error.name === 'AbortError';

    let detailedMessage = error.message;

    if (error.cause) {
      detailedMessage += ` | cause: ${error.cause.code || ''} ${error.cause.message || ''}`;
    }

    return {
      ok: false,
      error: isAbort ? 'Request timeout' : detailedMessage,
      status: 500,
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
 *       console.logger.info('Stream is live:', data);
 *     } else {
 *       console.logger.info('Stream is not live or an error occurred');
 *     }
 *   })
 *   .catch(err => {
 *     console.error('Error checking stream:', err);
 *   });
 */
module.exports = async (url) => {
  if (!url || typeof url !== "string" || !isValidURL(url)) {
    return {
      ok: false,
      error: `url must be a string with a valid URL format: ${url}`,
    };
  }

  url = cleanURL(url);

  // Always test HTTPS first
  if (url.startsWith("http://")) {
    const httpsUrl = url.replace("http://", "https://");
    try {
      return await retry(() => streamTest(httpsUrl));
    } catch (error) {
      logger.error(`HTTPS test failed for ${httpsUrl}: ${error.message}`);
      logger.debug(`Falling back to HTTP: ${url}`);
    }
  }

  try {
    return await retry(() => streamTest(url));
  } catch (e) {
    logger.error(`Failed testing http: ${e.message}`);
  }
};
