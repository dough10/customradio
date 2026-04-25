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
 * 
 * @param {Buffer} buf 
 * @returns {Boolean}
 */
function looksLikeHTML(buf) {
  if (!buf || buf.length === 0) return false;
  const str = new TextDecoder().decode(buf.slice(0, 128)).toLowerCase();
  return str.includes("<html") || str.includes("<!doctype");
}

/**
 * 
 * @param {Buffer} buf 
 * @returns {Boolean}
 */
function looksLikeMP3(buf) {
  if (!buf || buf.length < 4) return false;

  for (let i = 0; i < buf.length - 1; i++) {
    if (
      buf[i] === 0x49 &&
      buf[i + 1] === 0x44 &&
      buf[i + 2] === 0x33
    ) {
      return true;
    }

    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      return true;
    }
  }

  return false;
}

/**
 * 
 * @param {String} message 
 * @param {Boolean} ok 
 * @param {Number} status 
 * 
 * @returns {Object}
 */
function returnError(message, status) {
  logger.debug(message);
  return {
    ok: false,
    error: message,
    status,
  };
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
  const timeout = 10000;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      method: 'GET',
      headers: {
        "User-Agent": `radiotxt.site/${pack.version}`,
        "Accept": "audio/*, */*;q=0.9",
        "Icy-MetaData": "1",
        "Range": "bytes=0-"
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return returnError(`http_${response.status}`, response.status);
    }

    const headers = response.headers;

    let name = headers.get("icy-name") || headers.get("x-audiocast-name");
    const description = headers.get("icy-description") || "";
    const icyGenre = headers.get("icy-genre") || headers.get("x-audiocast-genre") || "Unknown";
    const content = headers.get("content-type");
    const icyurl = headers.get("icy-url") || "";
    const finalUrl = response.url;
    let bitrate = parseInt(headers.get("icy-br"), 10);

    if (!Number.isFinite(bitrate)) bitrate = 0;
    if (bitrate > 0 && (bitrate < 8 || bitrate > 512)) bitrate = 0;

    const normalizedContent = content?.split(";")[0].trim().toLowerCase();

    if (!normalizedContent) {
      return returnError("missing_content_type", response.status);
    }

    if (!usedTypes.includes(normalizedContent)) {
      return returnError(`invalid content-type: ${content}`, response.status);
    }

    if (!response.body) {
      return returnError("no_response_body", response.status);
    }

    const reader = response.body.getReader();
    let firstChunk;

    if (reader) {
      const { value } = await reader.read();
      firstChunk = value;

      if (!firstChunk) {
        await reader.cancel();
        return returnError("No audio data received", response.status);
      }

      if (!looksLikeMP3(firstChunk)) {
        const { value: secondChunk } = await reader.read();
        if (secondChunk) {
          const combined = new Uint8Array(firstChunk.length + secondChunk.length);
          combined.set(firstChunk);
          combined.set(secondChunk, firstChunk.length);
          firstChunk = combined;
        }
      }

      await reader.cancel();
    }

    if (!firstChunk || firstChunk.length === 0) {
      return returnError("No audio data received", response.status);
    }

    if (looksLikeHTML(firstChunk)) {
      return returnError("HTML response instead of audio stream", response.status);
    }

    if (!looksLikeMP3(firstChunk)) {
      return returnError("Invalid MP3 stream", response.status);
    }

    if (name) {
      name = fixEncoding(name);
      const unhelpfulRegex = /^\d{1,2}$/;
      const cleanName = name.toLowerCase().trim();

      if (unhelpfulNames.includes(cleanName) || unhelpfulRegex.test(cleanName)) {
        name = null;
      }
    }

    if (!name) {
      try {
        name = new URL(finalUrl).hostname;
      } catch {
        name = finalUrl;
      }
    }

    return {
      ok: true,
      url: finalUrl,
      name,
      description: fixEncoding(description),
      icyurl,
      isLive: true,
      icyGenre,
      content,
      bitrate,
      error: "",
      status: response.status,
    };

  } catch (error) {
    clearTimeout(timeoutId);

    const isAbort = error.name === 'AbortError';

    let errorMessage;

    if (isAbort) errorMessage = "timeout";
    else if (error.cause?.code === "ENOTFOUND") errorMessage = "dns_failure";
    else if (error.cause?.code === "ECONNREFUSED") errorMessage = "connection_refused";
    else errorMessage = error.message;

    return returnError(errorMessage, 500);
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
