module.exports = isLiveStream;


const axios = require('axios');


/**
 * An array containing default port numbers used in network protocols.
 * 
 * @constant {string[]} defaultPorts
 * @default
 * @example
 * // Accessing the default ports
 * console.log(defaultPorts[0]); // Output: ':80/'
 * console.log(defaultPorts[1]); // Output: ':443/'
 */
const defaultPorts = [
  ':80/',
  ':443/'
];

/**
 * Tests if the provided URL is an audio stream and retrieves related information.
 *
 * This function sends a HEAD request to the given URL to check if it is a live audio stream
 * by inspecting the response headers. It checks for audio-related headers and parses them,
 * returning an object with stream details if the URL points to a valid audio stream.
 *
 * @param {string} url - The URL to be tested for streaming.
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
      timeout: 3000
    });
    const isLive = response.status === 200;
    const name = response.headers['icy-name'];
    const description = response.headers['icy-description'];
    const icyGenre = response.headers['icy-genre'];
    const bitrate = response.headers['icy-br'];
    const content = response.headers['content-type'];
    const isAudioStream = content && content.startsWith('audio/');

    if (!isAudioStream) return false;

    return {
      url,
      name: name || 'Unknown',
      description,
      isLive,
      icyGenre: icyGenre || 'Unknown',
      content,
      bitrate: bitrate ? parseInt(bitrate, 10) : 'Unknown'
    };
  } catch (error) {
    return false;
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
 *       console.log('Stream is live:', data);
 *     } else {
 *       console.log('Stream is not live or an error occurred');
 *     }
 *   })
 *   .catch(err => {
 *     console.error('Error checking stream:', err);
 *   });
 */
async function isLiveStream(url) {
  if (!url || typeof url !== 'string') return false;
  defaultPorts.forEach(port => {
    url = url.replace(port, '/');
  });

  if (url.startsWith('http://')) {
    const httpsUrl = url.replace('http://', 'https://');
    const httpsStream = await streamTest(httpsUrl);
    if (httpsStream) return httpsStream;
  }
  return await streamTest(url);
}