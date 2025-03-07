require('dotenv').config();
const xml2js = require('xml2js');
const axios = require('axios');
const pack = require('../package.json');

const {testHomepageConnection, plural, msToHhMmSs} = require('./testStreams.js');
const rmRef = require('./rmRef.js');
const isLiveStream = require('./isLiveStream.js');
const usedTypes = require("./usedTypes.js");
const Logger = require('./logger.js');
const Stations = require('../model/Stations.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);



/**
 * Scrapes the Icecast directory for new stations
 * 
 * @returns {Promise<void>}
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
module.exports = async () => {
  const sql = new Stations('data/customradio.db');

  try {
    const res = await axios.get('http://dir.xiph.org/yp.xml', {
      headers: {
        'User-Agent': `customradio.dough10.me/${pack.version}`
      },
      timeout: 20000
    });
    if (!res.data) return;
    
    const parser = new xml2js.Parser();
    
    const result = await parser.parseStringPromise(res.data);
    
    const data = result.directory.entry;
    
    let total = 0;
    
    const startTime = new Date().getTime();
    
    const length = data.length;
    
    log.info(`Scraping Icecast Directory for new stations. ${length} stations pulled`);
    
    const testedHomepages = [];
    for (const entry of data) {
      log.debug(`Scrape progress: ${((data.indexOf(entry) / length) * 100).toFixed(3)}%`);
      
      const url = rmRef(entry.listen_url[0]);
      const stream = await isLiveStream(url);
    
      if (!stream.ok) continue;
    
      if (!usedTypes.$in.includes(stream.content)) continue;
    
      if (await sql.exists(stream.url)) continue;
    
      const result = await sql.addStation({
        name: stream.name || entry.server_name[0] || stream.description,
        url: stream.url,
        genre: stream.icyGenre || entry.genre[0] || 'Unknown',
        online: stream.isLive,
        'content-type': stream.content || '',
        bitrate: stream.bitrate || 0,
        icon: 'Unknown',
        homepage: await testHomepageConnection(stream.icyurl, testedHomepages) || 'Unknown',
        error:  '',
        duplicate: false
      });
      log.debug(`Added station: ${result}`);
      if (result !== 'Station exists') total += 1;
    }
    const stats = await sql.dbStats();
    const now = new Date().getTime();
    const ms = now - startTime;
    stats.timeCompleted = now;
    stats.duration = ms;
    log.info(`Icecast Directory scrape complete: ${total} entry${plural(total)} added over ${msToHhMmSs(ms)}. usable entrys: ${stats.total}, online: ${stats.online}, offline: ${stats.total - stats.online}`);
    // await saveStats(stats);
  } catch(err) {
    log.critical(`Scrape failed: ${err.message}`);
  } finally {
    await sql.close();
  }
};