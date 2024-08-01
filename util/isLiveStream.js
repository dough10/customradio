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
  try {
    defaultPorts.forEach(port => {
      url = url.replace(port, '/');
    });

    if (url.startsWith('http://')) {
      const httpsUrl = url.replace('http://', 'https://');
      const httpsResponse = await axios.head(httpsUrl, {
        timeout: 3000
      });
      if (httpsResponse.status === 200) {
        url = httpsUrl;
        const isLive = httpsResponse.status === 200;
        const name = httpsResponse.headers['icy-name'];
        const icyGenre = httpsResponse.headers['icy-genre'];
        const bitrate = httpsResponse.headers['icy-br'];
        const content = httpsResponse.headers['content-type'];
        return {
          url,
          name,
          isLive,
          icyGenre,
          content,
          bitrate
        };
      }
    }

    const response = await axios.head(url, {
      timeout: 3000
    });
    const isLive = response.status === 200;
    const name = response.headers['icy-name'];
    const icyGenre = response.headers['icy-genre'];
    const bitrate = response.headers['icy-br'];
    const content = response.headers['content-type'];
    return {
      url,
      name,
      isLive,
      icyGenre,
      content,
      bitrate
    };
  } catch (error) {
    return false;
  }
}