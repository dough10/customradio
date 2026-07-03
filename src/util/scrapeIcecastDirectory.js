require('dotenv').config();
const xml2js = require('xml2js');
const pack = require('../../package.json');

const { testHomepageConnection, plural, msToHhMmSs } = require('./testStreams.js');
const isLiveStream = require('./isLiveStream.js');
const usedTypes = require("./usedTypes.js");
const retry = require('./retry.js');
const { stations, logger, mongo } = require('./../services.js');


let scraping = false;
let progressCounter = 0;
let changed = 0;

/**
 * get data from icecast directory
 * 
 * @returns {Array|Boolean}
 */
async function requestData() {
  const controller = new AbortController();
  const timeout = 20000;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const res = await fetch('http://dir.xiph.org/yp.xml', {
      headers: {
        'User-Agent': `radiotxt.site/${pack.version}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return false;
    }

    let text = await res.text();
    if (!text) return false;

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(text);

    text = null;

    return result?.directory?.entry || false;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      logger.warn('requestData timeout');
    } else {
      logger.warn('requestData failed:', err.message);
    }

    return false;
  }
}

/**
 * 
 * @param {Object} entry 
 * @param {Number} length 
 * @param {Object} stations 
 * 
 * @returns {void}
 * 
 * data structure
 * {
 *   server_name: [ 'radio2000x.com' ],
 *   server_type: [ 'audio/mpeg' ],
 *   bitrate: [ '256' ],
 *   samplerate: [ '0' ],
 *   channels: [ '0' ],
 *   listen_url: [ 'http://air.radio2000x.com:8020/stream' ],
 *   current_song: [ "Coolio - Gangsta's Paradise" ],
 *   genre: [ '2000-х Музыка' ]
 * }
 */
async function processStream(entry, length, stations) {
  progressCounter++;
  logger.debug(`Scrape progress: ${((progressCounter / length) * 100).toFixed(3)}%`);

  if (progressCounter % 100 === 0) {
    const mem = process.memoryUsage();

    logger.debug(
      `Progress ${progressCounter}/${length} | ` +
      `Heap ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB | ` +
      `RSS ${(mem.rss / 1024 / 1024).toFixed(1)} MB`
    );
  }
  try {
    const url = entry.listen_url[0];

    if (!url) return;

    // early check for url in database
    // isLiveStream may change url protocol (http -> https)
    // addStation method checks again. this line keeps from doing extra work
    if (await stations.exists(url)) return;

    const stream = await isLiveStream(url);

    // do not add if stream offline
    if (!stream.ok) return;

    // check if stream is allowed content type
    if (!usedTypes.includes(stream.content)) return;

    const result = await stations.addStation({
      name: stream.name || entry.server_name[0] || stream.description,
      url: stream.url,
      genre: stream.icyGenre || entry.genre[0] || 'Unknown',
      online: stream.isLive,
      'content-type': stream.content,
      bitrate: stream.bitrate || 0,
      icon: 'Unknown',
      homepage: await retry(() => testHomepageConnection(stream.icyurl)) || 'Unknown',
      error: '',
      duplicate: false
    });

    if (result === 'Station exists') return;
    logger.debug(`Added station: ${result}`);
    changed++;
  } catch (e) {
    logger.error(`Error processing entry: ${e.message}`);
  }
}

/**
 * Scrapes the Icecast directory for new stations
 * 
 * @returns {Promise<void>}
 */
module.exports = async () => {
  if (scraping) return;
  scraping = true;
  const start = await stations.dbStats();

  progressCounter = 0;
  changed = 0;
  try {
    logger.info(`Scraping Icecast Directory for new stations.`);
    const data = await requestData();
    if (!data) throw Error('Fetch failed');
    const length = data.length;

    const mem = process.memoryUsage();
    logger.info(
      `Initial heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB | Initial RSS ${(mem.rss / 1024 / 1024).toFixed(1)} MB | (${length} stations)`
    );


    const workers = Array.from({ length: 5 }, async _ => {
      while (data.length > 0) {
        const entry = data.pop();
        if (!entry) break;

        await processStream(entry, length, stations);
      }
    });

    await Promise.all(workers);
    const end = await stations.dbStats();
    logger.info(`Icecast Directory scrape complete: ${changed} entry${plural(changed)} added over ${msToHhMmSs(end.time - start.time)}. Total: ${end.total}, Online: ${end.online}, Offline: ${end.total - end.online}`);
    await mongo.logDBUpdateResults(changed, start, end, 'scrape');
  } catch (err) {
    await mongo.logJSError(err);
    logger.critical(`Scrape failed: ${err.message}`);
  } finally {
    changed = 0;
    progressCounter = 0;
    scraping = false;
  }
};