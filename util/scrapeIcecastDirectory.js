require('dotenv').config();
const xml2js = require('xml2js');
const axios = require('axios');
const pack = require('../package.json');
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
    let counter = 0;
    await Promise.all(
      data.map(entry =>
        limit(async () => {
          counter++;
          log.debug(`Scrape progress: ${((counter / length) * 100).toFixed(3)}%`);
          
          try{
            const url = rmRef(entry.listen_url[0]);
            if (await sql.exists(url)) return;
            
            const stream = await isLiveStream(url);
          
            if (!stream.ok) return;
            if (!usedTypes.includes(stream.content)) return;
          
            const result = await sql.addStation({
              name: stream.name || entry.server_name[0] || stream.description,
              url: stream.url,
              genre: stream.icyGenre || entry.genre[0] || 'Unknown',
              online: stream.isLive,
              'content-type': stream.content || '',
              bitrate: stream.bitrate || 0,
              icon: 'Unknown',
              homepage: await retry(() => testHomepageConnection(stream.icyurl)) || 'Unknown',
              error: '',
              duplicate: false
            });
            if (result !== 'Station exists') {
              log.debug(`Added station: ${result}`);
              total += 1;
            }
          } catch(e) {
            log.error(`Error processing entry: ${err.message}`);
          }
        })
      )
    );
    const stats = await sql.dbStats();
    const now = new Date().getTime();
    const ms = now - startTime;
    log.info(`Icecast Directory scrape complete: ${total} entry${plural(total)} added over ${msToHhMmSs(ms)}. usable entries: ${stats.total}, online: ${stats.online}, offline: ${stats.total - stats.online}`);
  } catch (err) {
    log.critical(`Scrape failed: ${err.message}`);
  } finally {
    await sql.close();
  }
};