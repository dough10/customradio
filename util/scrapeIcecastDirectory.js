require('dotenv').config();
const xml2js = require('xml2js');
const axios = require('axios');
const pack = require('../package.json');

const {testHomepageConnection, plural, msToHhMmSs} = require('./testStreams.js');
const rmRef = require('./rmRef.js');
const isLiveStream = require('./isLiveStream.js');
const usedTypes = require("./usedTypes.js");
const Logger = require('./logger.js');
const dbStatistics = require('./dbStatistics.js');
const saveStats = require('./saveStats.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

// data structure
// {
//   server_name: [ 'radio2000x.com' ],
//   server_type: [ 'audio/mpeg' ],
//   bitrate: [ '256' ],
//   samplerate: [ '0' ],
//   channels: [ '0' ],
//   listen_url: [ 'http://air.radio2000x.com:8020/stream' ],
//   current_song: [ "Coolio - Gangsta's Paradise" ],
//   genre: [ '2000-х Музыка' ]
// }
module.exports = async (db) => {
  try {
    const res = await axios.get('http://dir.xiph.org/yp.xml', {
      headers: {
        'User-Agent': `customradio.dough10.me/${pack.version}`
      },
      timeout: 3000
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
      log.debug(`Scraping Icecast Directory: ${((data.indexOf(entry) / length) * 100).toFixed(3)}%`);
      
      const url = rmRef(entry.listen_url[0]);
      const stream = await isLiveStream(url);
    
      if (!stream.ok) continue;
    
      if (!usedTypes.$in.includes(stream.content)) continue;
    
      if (await db.findOne({url: stream.url})) continue;
    
      if (stream.icyurl) {
        stream.icyurl = await testHomepageConnection(stream.icyurl, testedHomepages);
      }
    
      await db.insertOne({
        name: stream.name || entry.server_name[0] || stream.description,
        url: stream.url,
        genre: stream.icyGenre || entry.genre[0] || 'Unknown',
        online: stream.isLive,
        'content-type': stream.content,
        bitrate: stream.bitrate || 'Unknown',
        icon: 'Unknown',
        homepage: stream.icyurl || 'Unknown',
        error: undefined
      });
      total += 1;
    }
    const stats = await dbStatistics(db);
    const now = new Date().getTime();
    const ms = now - startTime;
    stats.timeCompleted = now;
    stats.duration = ms;
    log.info(`Icecast Directory scrape complete: ${total} entry${plural(total)} added over ${msToHhMmSs(ms)}. usable entrys: ${stats.usableEntrys}, online: ${stats.online}, offline: ${stats.offline}`);
    await saveStats(stats);
  } catch(err) {
    log.critical(`Scrape failed: ${err.message}`);
  }
};