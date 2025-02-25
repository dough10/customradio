module.exports = {testStreams, plural, testHomepageConnection, msToHhMmSs};


const {ObjectId} = require('mongodb');
const pack = require('../package.json');

const Logger = require('./logger.js');
const isLiveStream = require('./isLiveStream.js');
const rmRef = require('./rmRef.js');
const dbStatistics = require('./dbStatistics.js');
const saveStats = require('./saveStats.js');
const useableHomapage = require('./useableHomapage.js');
const cleanUpGenres = require('./cleanUpGenres.js');

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
  const homepage = await useableHomapage(url);
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
    if (response.status >= 200 && response.status < 300) {
      testedHomepages.push(homepage);
      return homepage;
    }
  } catch(e) {
    return;
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
 * @param {Object} db - The MongoDB database object used to query and update records.
 * 
 * @returns {Promise<void>} A promise that resolves when the database update is complete.
 * 
 * @throws {Error} Throws an error if the database operations fail.
 * 
 * @example
 * 
 * testStreams(db)
 *   .then(() => {
 *     console.log.info('Streams tested and database updated successfully.');
 *   })
 *   .catch(err => {
 *     console.error('Failed to test streams and update database:', err);
 *   });
 */
async function testStreams(db) {
  log.info('Updating database');

  const startTime = new Date().getTime();
  
  const stations = await db.find({}).toArray();
  
  let total = 0;
  
  const length = stations.length;

  const testedHomepages = [];

  for (const station of stations) {
    if (!station) continue;
    log.debug(`Updating database: ${((stations.indexOf(station) / length) * 100).toFixed(3)}%`);
    const filter = {
      _id: new ObjectId(station._id)
    };
    station.url = rmRef(station.url);
    const stream = await isLiveStream(station.url);

    // stream connection test failed
    if (!stream.ok) {
      const res = await db.updateOne(filter, {
        $set: {
          online: false,
          error: stream.error
        }
      });
      total += res.modifiedCount;
      continue;
    }

    // ensure homepage url is usable
    if (stream.icyurl) {
      stream.icyurl = await testHomepageConnection(stream.icyurl, testedHomepages);
    }

    // save updates
    const res = await db.updateOne(filter, {
      $set: {
        name: stream.name || station.name || stream.description,
        url: stream.url,
        genre: stream.icyGenre || station.genre || 'Unknown',
        online: stream.isLive,
        'content-type': stream.content,
        bitrate: stream.bitrate || 'Unknown',
        icon: 'Unknown',
        homepage: stream.icyurl || 'Unknown',
        error: undefined
      }
    });
    total += res.modifiedCount;
  }
  const stats = await dbStatistics(db);
  const now = new Date().getTime();
  const ms = now - startTime;
  stats.timeCompleted = now;
  stats.duration = ms;
  log.info(`Database update complete: ${total} entry${plural(total)} updated over ${msToHhMmSs(ms)}. usable entrys: ${stats.usableEntrys}, online: ${stats.online}, offline: ${stats.offline}`);
  await saveStats(stats);
  await cleanUpGenres();
}