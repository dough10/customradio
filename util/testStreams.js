const UPDATE_PULL_COUNT = 100;

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
  return Number.isInteger(num) && num === 1 ? '' : 's';
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
 * @param {Object} old - The original station object.
 * @param {Object} updated - The updated stream object.
 * @returns {Promise<void>}
 */
async function updateStationData(sql, old, updated) {
  const homepage = await retry(() => testHomepageConnection(updated.icyurl))
    .catch(e => {
      log.debug(`Failed to resolve homepage for station ID ${old.id}: ${e.message}`);
      return null;
    });

  const updatedData = {
    id: old.id,
    name: (updated.name && typeof updated.name === 'string') ? updated.name : old.name,
    url: updated.url || old.url,
    genre: (updated.icyGenre && typeof updated.icyGenre === 'string') ? updated.icyGenre : old.genre || 'Unknown',
    online: (typeof updated.isLive === 'boolean') ? updated.isLive : false,
    'content-type': updated.content || old['content-type'] || 'Unknown',
    bitrate: updated.bitrate || 0,
    icon: 'Unknown',
    homepage: homepage || old.homepage || 'Unknown',
    error: updated.error || '',
    duplicate: Boolean(old.duplicate) || false,
    playMinutes: old.playMinutes,
    inList: old.inList,
  };

  await sql.updateStation(updatedData);
}

/**
 * Compares station and stream objects to check if data has changed.
 * 
 * @param {Object} old - The station object from the database.
 * @param {Object} updated - The stream object from the live stream check.
 * 
 * @returns {Boolean} - Returns true if the data is unchanged, false otherwise.
 */
function stationDataIsUnchanged(old, updated) {
  const name = updated.name || old.name;
  const url = updated.url || old.url;
  const genre = updated.icyGenre || old.genre || 'Unknown';
  const online = typeof updated.isLive === 'boolean' ? updated.isLive : false;
  const contentType = updated.content || old['content-type'] || 'Unknown';
  const bitrate = updated.bitrate || 0;

  return (
    old.name === name &&
    old.url === url &&
    old.genre === genre &&
    old.online === online &&
    old['content-type'] === contentType &&
    old.bitrate === bitrate
  );
}

/**
 * filesize in MB
 * 
 * @param {Number} heap 
 * 
 * @returns {String}
 */
function toMB(heap) {
 if (typeof heap !== 'number' || isNaN(heap)) return '0.00 MB';
 return `${(heap / 1024 / 1024).toFixed(2)} MB`;
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
    const totalStationCount = await sql.getTotalCount();
    let counter = 0;

    const parts = Math.ceil(totalStationCount / UPDATE_PULL_COUNT);

    let total = 0;

    let peakHeap = 0; 
    
    const startTime = Date.now();
    
    for (let ndx = 0; ndx < parts; ndx++) {
      const used = process.memoryUsage();
      peakHeap = Math.max(peakHeap, used.heapUsed);
      log.info(`Memory usage: ${toMB(used.heapUsed)}, Peak: ${toMB(peakHeap)}`);
      const offset = ndx * UPDATE_PULL_COUNT;
      try {
        const stationPull = await sql.getPaginatedStations(UPDATE_PULL_COUNT, offset);
        const length = stationPull.length;
        await Promise.all(
          stationPull.map(station => limit(async () => {
            counter++;
            const partCount = counter - (ndx * UPDATE_PULL_COUNT);
            log.debug(`Update progress: part ${ndx}/${parts}, station ${partCount}/${length} Part: ${((partCount/length) * 100).toFixed(1)}% Total: ${((counter / totalStationCount) * 100).toFixed(3)}%`);
            if (!station) return;
            try {
              const stream = await retry(() => isLiveStream(station.url));
              if (stationDataIsUnchanged(station, stream)) {
                log.debug(`Station ID ${station.id}: No change..`);
                return;
              }
              await updateStationData(sql, station, stream);
              log.debug(`Station ID ${station.id}: Updated..`);
              total++;
            } catch (e) {
              log.debug(`Error testing stream for station ID ${station.id} (${station.name}): ${e.message}`);
            }
          }))
        );
      } catch(e) {
        log.error(`Failed updating database part ${ndx}: ${e.message}`);
      }
      if (global.gc) {
        global.gc();
       log.debug('Forced garbage collection after batch processing to reduce memory pressure');
      }
    }
    const stats = await sql.dbStats();
    const now = new Date().getTime();
    const ms = now - startTime;

    log.info(`Database update complete: ${total} entry${plural(total)} updated over ${msToHhMmSs(ms)}. usable entries: ${stats.total}, online: ${stats.online}, offline: ${stats.total - stats.online}`);
  } catch(e) {
    log.error(`Database update has failed: ${e.message}`)
  } finally {
    await sql.close();
  }
}

module.exports = {testStreams, plural, testHomepageConnection, msToHhMmSs, updateStationData};