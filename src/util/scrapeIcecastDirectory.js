require('dotenv').config();
const xml2js = require('xml2js');
const axios = require('axios');
const pack = require('../../package.json');
const pLimit = require('p-limit');

const { testHomepageConnection, plural, msToHhMmSs } = require('./testStreams.js');
const rmRef = require('./rmRef.js');
const isLiveStream = require('./isLiveStream.js');
const usedTypes = require("./usedTypes.js");
const retry = require('./retry.js');
const Logger = require('./logger.js');
const Stations = require('../model/Stations.js');

const limit = pLimit(5);
const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);


let progressCounter = 0;
let changed = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * get data from icecast directory
 * 
 * @returns {Array|Boolean}
 */
async function requestData() {
  const res = await axios.get('http://dir.xiph.org/yp.xml', {
    headers: {
      'User-Agent': `radiotxt.site/${pack.version}`
    },
    timeout: 20000
  });
  if (!res.data) return false;
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(res.data);
  return result.directory.entry;
}

/**
 * 
 * @param {Object} entry 
 * @param {Number} length 
 * @param {Object} sql 
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
async function processStream(entry, length, sql) {
  progressCounter++;
  log.debug(`Scrape progress: ${((progressCounter / length) * 100).toFixed(3)}%`);
  
  try{
    const url = rmRef(entry.listen_url[0]);

    // early check for url in database
    // isLiveStream may change url protocol (http -> https)
    // addStation method checks again. this line keeps from doing extra work
    if (await sql.exists(url)) return;
    
    const stream = await isLiveStream(url);
  
    // do not add if stream offline
    if (!stream.ok) return;
    
    // check if stream is allowed content type
    if (!usedTypes.includes(stream.content)) return;
  
    const result = await sql.addStation({
      name: stream.name || entry.server_name[0] || stream.description,
      url: stream.url,
      genre: stream.icyGenre || entry.genre[0] || 'Unknown',
      online: stream.isLive,
      'content-type': stream.content || 'Unknown',
      bitrate: stream.bitrate || 0,
      icon: 'Unknown',
      homepage: await retry(() => testHomepageConnection(stream.icyurl)) || 'Unknown',
      error: '',
      duplicate: false
    });

    if (result === 'Station exists') return;
    log.debug(`Added station: ${result}`);
    changed++;
  } catch(e) {
    log.error(`Error processing entry: ${e.message}`);
  }
}

/**
 * Scrapes the Icecast directory for new stations
 * 
 * @returns {Promise<void>}
 */
module.exports = async () => {
  const sql = new Stations('data/customradio.db');

  const startTime = new Date().getTime();
  progressCounter = 0;
  changed = 0;
  try {
    const data = await requestData();
    if (!data) throw Error('Fetch failed');
    const length = data.length;
    
    log.info(`Scraping Icecast Directory for new stations. ${length} stations pulled`);
    await Promise.all(
      data.map(entry => 
        limit(() => processStream(entry, length, sql))
      )
    );
    const {total, online} = await sql.dbStats();
    const now = new Date().getTime();
    log.info(`Icecast Directory scrape complete: ${changed} entry${plural(changed)} added over ${msToHhMmSs(now - startTime)}. usable entries: ${total}, online: ${online}, offline: ${total - online}`);
    await sleep(500); 
  } catch (err) {
    log.critical(`Scrape failed: ${err.message}`);
  } finally {
    await sql.close();
    changed = 0;
    progressCounter = 0;
  }
};