const UPDATE_PULL_COUNT = 100;

const axios = require('axios');
const pack = require('../../package.json');
const pLimit = require('p-limit');

const isLiveStream = require('./isLiveStream.js');
const useableHomepage = require('./useableHomepage.js');
const {stations, logger} = require('./../services.js');
const retry = require('./retry.js');

const limit = pLimit(5);

let counter = 0;
let updatedCount = 0;

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

/**
 * Returns `'y'` when the count is exactly **1** (e.g. “entry”) and `'ies'` for all other counts (e.g. “entries”).
 * 
 * This function is useful for creating plural forms of words based on the number provided.
 * For example, it helps in formatting messages that include counts, such as "1 item" vs. "2 items".
 * 
 * @function
 * 
 * @param {number} num - The number to determine if pluralization is needed.
 * 
 * Returns `'y'` when the count is exactly **1** (e.g. “entry”) and `'ies'` for all other counts (e.g. “entries”).
 * 
 * @example
 * 
 * plural(1);
 * // Returns: 'y'
 * 
 * plural(5);
 * // Returns: 'ies'
 */
function plural(num) {
  return Number.isInteger(num) && num === 1 ? 'y' : 'ies';
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
      timeout: 1500
    });
    if (response.status >= 200 && response.status < 300 && response.headers['content-type'].includes('text/html')) {
      return homepage;
    }
  } catch(e) {
    logger.debug(`${url} failed homepage test connection: ${e.message}`);
    return;
  }
}

/**
 * Update station data in the database.
 * 
 * @param {Object} stations - The Stations instance.
 * @param {Object} old - The original station object.
 * @param {Object} updated - The updated stream object.
 * @returns {Promise<void>}
 */
async function updateStationData(stations, old, updated) {
  const homepage = await retry(() => testHomepageConnection(updated.icyurl))
    .catch(e => {
      logger.debug(`Failed to resolve homepage for station ID ${old.id}: ${e.message}`);
      return null;
    });

  // logger.debug(typeof updated.name);
  // logger.debug(updated.name);
  // logger.debug(old.name);

  const updatedData = {
    id: old.id,
    name: updated.name || old.name,
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

  await stations.updateStation(updatedData);
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
  const online = updated.isLive;
  const bitrate = updated.bitrate || 0;

  return (
    old.name === name &&
    old.url === url &&
    old.genre === genre &&
    Boolean(old.online) === online &&
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
 * calculate precentage
 * 
 * @param {Number} small smaller number
 * @param {Number} big bigger number
 * @param {Number} places decimal places
 *  
 * @returns {String}
 */
function percentage(small, big, places = 2) {
  if (typeof big !== 'number' || big === 0) return '0.00';
  return ((small / big) * 100).toFixed(places);
}

/**
 * 
 * @param {Object} station current entry for the station in question
 * @param {Number} ndx batch index 
 * @param {Number} offset ndx * (desired pull count)
 * @param {Number} length  
 * @param {Object} stations sqlite database class instance
 * @param {Number} totalStationCount total count of stations in the database
 * @param {Number} parts number of batches (totalStationCount / (desired batch length))
 * 
 * @returns {void}
 */
async function processStream(station, ndx, offset, length, stations, totalStationCount, parts) {
  counter++; 
  
  const partCount = counter - offset;
  const partPrecent = length ? percentage(partCount, length, 1) : '0.0';
  const totalPrecent = percentage(counter, totalStationCount, 3);
  
  try {
    const startTime = Date.now()
    logger.debug(`[${station.id}] Testing url ${station.url}`);
    logger.debug(`[${station.id}] Station: ${partCount}/${length}, ${partPrecent}%`);
    logger.debug(`[${station.id}] Part: ${ndx + 1}/${parts}, Total progress: ${totalPrecent}%`);
    
    const stream = await retry(() => isLiveStream(station.url));

    if (stationDataIsUnchanged(station, stream)) {
      logger.debug(`[${station.id}] No change.. ${Date.now() - startTime}ms`);
      return;
    }
    
    await updateStationData(stations, station, stream);
    logger.debug(`[${station.id}] Updated.. ${Date.now() - startTime}ms`);
    
    // count changes
    updatedCount++;
  } catch (e) {
    logger.debug(`[${station.id}] Error for (${station.name}): ${e.message}`);
  } 
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
 *     console.logger.info('Streams tested and database updated successfully.');
 *   })
 *   .catch(err => {
 *     console.error('Failed to test streams and update database:', err);
 *   });
 */
async function testStreams() {
  const startTime = Date.now();
  logger.info(`Starting database update at ${new Date(startTime).toISOString()}`);
  try {
    const totalStationCount = await stations.getTotalCount();
    const parts = Math.ceil(totalStationCount / UPDATE_PULL_COUNT);
    
    counter = 0;
    updatedCount = 0;
    
    for (let ndx = 0; ndx < parts; ndx++) {
      const offset = ndx * UPDATE_PULL_COUNT;
      const stationPull = await stations.getPaginatedStations(UPDATE_PULL_COUNT, offset);
      const length = stationPull.length;

      await Promise.all(
        stationPull.map(station => 
          limit(() => 
            processStream(station, ndx, offset, length, stations, totalStationCount, parts)
          )
        )
      );

      // track memory usage
      const used = process.memoryUsage();
      logger.info(`Memory usage: ${toMB(used.heapUsed)}`);

      // Forced garbage collection after batch processing to reduce memory pressure
      if (global.gc) {
        global.gc();
        logger.debug('Garbage collected');
      }
    }
    const duration = msToHhMmSs(Date.now() - startTime);
    const stats = await stations.dbStats();

    logger.info(`Update complete: ${updatedCount} entr${plural(updatedCount)} updated in ${duration}.`);
    logger.info(`Stats - Total: ${stats.total}, Online: ${stats.online}, Offline: ${stats.total - stats.online}`);
  } catch(e) {
    logger.error(`Database update failed: ${e.message}`);
  }

}

module.exports = {testStreams, plural, testHomepageConnection, msToHhMmSs, updateStationData, stationDataIsUnchanged};