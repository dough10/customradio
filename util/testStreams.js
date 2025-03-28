module.exports = {testStreams, plural, testHomepageConnection, msToHhMmSs};

const axios = require('axios');
const pack = require('../package.json');

const isLiveStream = require('./isLiveStream.js');
const rmRef = require('./rmRef.js');
const useableHomepage = require('./useableHomepage.js');
const Logger = require('./logger.js');
const Stations = require('../model/Stations.js');

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
 * @param {String[]} testedHomepages 
 * 
 * @returns {null|String}
 */
async function testHomepageConnection(url, testedHomepages) {
  const homepage = useableHomepage(url);
  if (!homepage) {
    return;
  }
  if (testedHomepages.includes(homepage)) {
    return homepage;
  }
  try {
    const response = await axios.head(homepage, {
      headers: {
        'User-Agent': `customradio.dough10.me/${pack.version}`
      },
      timeout: 3000
    });
    if (response.status >= 200 && response.status < 300 && response.headers['content-type'] === 'text/html') {
      testedHomepages.push(homepage);
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
 * @param {Array} testedHomepages - The array of tested homepages.
 * @returns {Promise<void>}
 */
async function updateStationData(sql, station, stream, testedHomepages) {
  const updatedData = {
    name: stream.name || station.name || stream.description,
    url: stream.url || station.url,
    genre: stream.icyGenre || station.genre || 'Unknown',
    online: stream.isLive || false,
    'content-type': stream.content || station['content-type'] || 'Unknown',
    bitrate: stream.bitrate || 0,
    icon: 'Unknown',
    homepage: await testHomepageConnection(stream.icyurl, testedHomepages) || 'Unknown',
    error: stream.error || '',
    duplicate: Boolean(station.duplicate) || false
  };

  await sql.updateStation(updatedData);
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
    
    const length = stations.length;
  
    const testedHomepages = [];
  
    for (const station of stations) {
      if (!station) continue;
      log.debug(`Update progress: ${((stations.indexOf(station) / length) * 100).toFixed(3)}%`);
  
      station.url = rmRef(station.url);
      
      try {
        const stream = await isLiveStream(station.url);
        // invalid url, error testing stream or is not an audio stream
        if (!stream.ok) {
          await updateStationData(sql, station, stream, testedHomepages);
          total += 1;
          continue;
        }
    
        await updateStationData(sql, station, stream, testedHomepages);
        total += 1;
      } catch(e) {
        log.error(`Error testing stream ${station.id}: ${e.message}`);
        continue;
      }
    }
    const stats = await sql.dbStats();
    const now = new Date().getTime();
    const ms = now - startTime;
    stats.timeCompleted = now;
    stats.duration = ms;
    log.info(`Database update complete: ${total} entry${plural(total)} updated over ${msToHhMmSs(stats.duration)}. usable entries: ${stats.total}, online: ${stats.online}, offline: ${stats.total - stats.online}`);
    // await saveStats(stats);
    // await cleanUpGenres();
  } catch (e) {
    log.error(`Failed stream test or database update: ${e.message}`);
  } finally { 
    await sql.close(); 
  }
}

module.exports = {testStreams, plural, testHomepageConnection, msToHhMmSs};