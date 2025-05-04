module.exports = {testStreams, plural, testHomepageConnection, msToHhMmSs};

const axios = require('axios');
const pack = require('../package.json');
const pLimit = require('p-limit');

const isLiveStream = require('./isLiveStream.js');
const rmRef = require('./rmRef.js');
const useableHomepage = require('./useableHomepage.js');
const Logger = require('./logger.js');
const Stations = require('../model/Stations.js');
const retry = require('./retry.js');

const limit = pLimit(5);

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * Returns an 's' if the number is not equal to 1, otherwise returns an empty string.
 * 
 * This function is useful for creating plural forms of words based on the number provided.
 * For example, it helps in formatting messages that include counts, such as "1 item" vs. "2 items".
 * 
 * @function
 * 
 * @param {number} num - The number to determine if pluralization is needed.
 * 
 * @returns {string} An 's' if `num` is not 1, otherwise an empty string.
 * 
 * @example
 * 
 * plural(1);
 * // Returns: ''
 * 
 * plural(5);
 * // Returns: 's'
 */
function plural(num) {
  return num === 1 ? '' : 's';
}

/**
 * Convert milliseconds into a formatted string "HH hours MM minutes and SS seconds"
 * 
 * @param {Number} milliseconds - time in milliseconds
 * 
 * @returns {String} - formatted time as "HH hours MM minutes and SS seconds"
 */
function msToHhMmSs(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const remainder = totalSeconds % 3600;
  const minutes = Math.floor(remainder / 60);
  const secs = remainder % 60;

  return `${hours > 0 ? `${hours} hours ` : ''}${minutes} minutes and ${secs} seconds`;
}

/**
 * breaks a string into parts and attempts to get a usable url from it
 * 
 * @param {String} url
 * 
 * @returns {null|String}
 */
async function testHomepageConnection(url) {
  const homepage = useableHomepage(url);
  if (!homepage) {
    return;
  }
  try {
    const response = await axios.head(homepage, {
      headers: {
        'User-Agent': `customradio.dough10.me/${pack.version}`
      },
      timeout: 3000
    });
    if (response.status >= 200 && response.status < 300 && response.headers['content-type'].includes('text/html')) {
      return homepage;
    }
  } catch(e) {
    log.debug(`${url} failed homepage test connection: ${e.message}`);
    return;
  }
}

/**
 * Update station data in the database.
 * 
 * @param {Object} sql - The Stations instance.
 * @param {Object} station - The station object.
 * @param {Object} stream - The stream object.
 * @returns {Promise<void>}
 */
async function updateStationData(sql, station, stream) {
  const updatedData = {
    name: stream.name || station.name || stream.description,
    url: stream.url || station.url,
    genre: stream.icyGenre || station.genre || 'Unknown',
    online: stream.isLive || false,
    'content-type': stream.content || station['content-type'] || 'Unknown',
    bitrate: stream.bitrate || 0,
    icon: 'Unknown',
    homepage: await retry(() => testHomepageConnection(stream.icyurl)) || 'Unknown',
    error: stream.error || '',
    duplicate: Boolean(station.duplicate) || false,
    playMinutes: station.playMinutes,
    inList: station.inList,
    id: station.id
  };

  await sql.updateStation(updatedData);
}

/**
 * Compares station and stream objects to check if data has changed.
 * 
 * @param {Object} station - The station object from the database.
 * @param {Object} stream - The stream object from the live stream check.
 * 
 * @returns {Boolean} - Returns true if the data is unchanged, false otherwise.
 */
function stationDataIsUnchanged(station, stream) {
  return (
    station.name === (stream.name || station.name || stream.description) &&
    station.url === (stream.url || station.url) &&
    station.genre === (stream.icyGenre || station.genre || 'Unknown') &&
    station.online === (stream.isLive || false) &&
    station['content-type'] === (stream.content || station['content-type'] || 'Unknown') &&
    station.bitrate === (stream.bitrate || 0) &&
    station.homepage === (stream.icyurl || station.homepage || 'Unknown') &&
    station.error === (stream.error || '') &&
    station.duplicate === Boolean(station.duplicate)
  );
}

/**
 * Tests streams for online state and headers to update the database with stream information.
 * 
 * This function queries the database for all station records, checks the online status and metadata
 * of each stream, and updates the corresponding database entries with the latest information.
 * 
 * @async
 * @function
 * 
 * @returns {Promise<void>} A promise that resolves when the database update is complete.
 * 
 * @throws {Error} Throws an error if the database operations fail.
 * 
 * @example
 * 
 * testStreams()
 *   .then(() => {
 *     console.log.info('Streams tested and database updated successfully.');
 *   })
 *   .catch(err => {
 *     console.error('Failed to test streams and update database:', err);
 *   });
 */
async function testStreams() {
  log.info('Updating database');
  const sql = new Stations('data/customradio.db');

  try {
    const startTime = new Date().getTime();
  
    const stations = await sql.getAllStations();
    
    let total = 0;

    let counter = 0;

    const length = stations.length;

    await Promise.all(
      stations.map(station =>
        limit(async () => {
          counter++;
          log.debug(`Update progress: ${((counter / length) * 100).toFixed(3)}%`);
          if (!station) return;
          try {
            const stream = await retry(() => isLiveStream(station.url));
            if (stationDataIsUnchanged(station, stream)) return;
            await updateStationData(sql, station, stream);
            total++;
          } catch (e) {
            log.debug(`Error testing stream for station ID ${station.id}: ${e.message}`);
          }
        })
      )
    );
    const stats = await sql.dbStats();
    const now = new Date().getTime();
    const ms = now - startTime;

    log.info(`Database update complete: ${total} entry${plural(total)} updated over ${msToHhMmSs(ms)}. usable entries: ${stats.total}, online: ${stats.online}, offline: ${stats.total - stats.online}`);
    // await cleanUpGenres();
  } catch (e) {
    log.error(`Failed stream test or database update: ${e.message}`);
  } finally { 
    await sql.close(); 
  }
}

module.exports = {testStreams, plural, testHomepageConnection, msToHhMmSs};