module.exports = {testStreams, plural};


const {ObjectId} = require('mongodb');


const log = require('./log.js');
const isLiveStream = require('./isLiveStream.js');


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
 *     console.log('Streams tested and database updated successfully.');
 *   })
 *   .catch(err => {
 *     console.error('Failed to test streams and update database:', err);
 *   });
 */
async function testStreams(db) {
  log('Updating database');
  const stations = await db.find({}).toArray();
  let total = 0;
  for (const station of stations) {
    if (!station) return;
    const stream = await isLiveStream(station.url);
    if (!stream) continue;
    if (stream.bitrate && stream.bitrate.length > 3) stream.bitrate = stream.bitrate.split(',')[0];
    const filter = {
      _id: new ObjectId(station._id)
    };
    const updates = {
      $set: {
        name: stream.name || station.name,
        url: stream.url,
        genre: stream.icyGenre || station.genre,
        online: stream.isLive,
        'content-type': stream.content,
        bitrate: stream.bitrate
      }
    };
    const res = await db.updateOne(filter, updates);
    total += res.modifiedCount;
  }
  log(`Database update complete: ${total} entry${plural(total)} updated`);
}