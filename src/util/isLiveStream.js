const pack = require("../../package.json");
const { EnvHttpProxyAgent } = require('undici');

const isValidURL = require("./isValidURL.js");
const fixEncoding = require("./fixEncoding.js");
const usedTypes = require("./usedTypes.js");
const rmRef = require('./rmRef.js');

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

const unhelpfulRegex = /^\d{1,2}$/;

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
  return rmRef(url);
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
  return {
    ok: false,
    error: message,
    status,
  };
}

/**
 * Tests if the provided URL is an audio stream and retrieves related information.
 *
 * This function sends a GET request to the given URL to check if it is a live audio stream
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
async function streamTest(url, timeout = 10_000) {
  const signal = AbortSignal.timeout(timeout);
  const dispatcher = new EnvHttpProxyAgent({ connections: 1 });

  let response = null;

  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": `radiotxt.site/${pack.version}`,
        "Accept": "audio/*, */*;q=0.9",
        "Icy-MetaData": "1",
        "Range": "bytes=0-"
      },
      signal,
      dispatcher
    });

    /*
     * Do not allow fetch/Undici to automatically follow
     * redirects. We can deal with them explicitly.
     */
    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      const location =
        response.headers.get("location");

      return {
        ok: false,
        error: "redirect",
        status: response.status,
        redirect: location || null,
        url
      };
    }

    if (!response.ok) {
      return returnError(
        `http_${response.status}`,
        response.status
      );
    }

    const headers = response.headers;

    let name = String(
      headers.get("icy-name") ||
      headers.get("x-audiocast-name")
    );

    const description =
      headers.get("icy-description") || "";

    const icyGenre =
      headers.get("icy-genre") ||
      headers.get("x-audiocast-genre") ||
      "Unknown";

    const content =
      headers.get("content-type");

    const icyurl =
      headers.get("icy-url") || "";

    const finalUrl =
      response.url || url;

    let bitrate = parseInt(
      headers.get("icy-br"),
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

    const normalizedContent =
      content
        ?.split(";")[0]
        .trim()
        .toLowerCase();

    if (!normalizedContent) {
      return returnError(
        "missing_content_type",
        response.status
      );
    }

    if (
      !usedTypes.includes(normalizedContent)
    ) {
      return returnError(
        `invalid content-type: ${content}`,
        response.status
      );
    }

    if (!response.body) {
      return returnError(
        "no_response_body",
        response.status
      );
    }

    /*
     * Clean up useless station names.
     */
    if (name) {
      const cleanName = fixEncoding(name).trim();
      if (
        unhelpfulNames.includes(cleanName.toLowerCase()) ||
        unhelpfulRegex.test(cleanName)
      ) {
        name = null;
      } else {
        name = cleanName;
      }
    }

    /*
     * Fall back to the hostname when the stream
     * doesn't provide a useful name.
     */
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
      status: response.status
    };

  } catch (error) {
    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      return returnError(
        "timeout",
        500
      );
    }

    if (
      error?.cause?.code === "ENOTFOUND"
    ) {
      return returnError(
        "dns_failure",
        500
      );
    }

    if (
      error?.cause?.code === "ECONNREFUSED"
    ) {
      return returnError(
        "connection_refused",
        500
      );
    }

    return returnError(
      error?.message || "fetch_failed",
      500
    );

  } finally {
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
module.exports = async (url, timeout = 10_000) => {
  if (
    !url ||
    typeof url !== "string" ||
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
  if (url.startsWith("http://")) {
    const httpsUrl =
      url.replace(/^http:\/\//i, "https://");

    const httpsResult =
      await streamTest(
        httpsUrl,
        timeout
      );

    if (httpsResult?.ok) {
      return httpsResult;
    }

    /*
     * HTTPS failed, so try the original HTTP URL.
     */
    const httpResult =
      await streamTest(
        url,
        timeout
      );

    if (httpResult?.ok) {
      return httpResult;
    }

    /*
     * Preserve the HTTPS error if both attempts failed,
     * unless the HTTP attempt produced a more useful
     * result.
     */
    return {
      ...httpResult,
      httpsError: httpsResult?.error
    };
  }

  return streamTest(
    url,
    timeout
  );
};

