const BaseStationProcessor = require('./BaseStationProcessor.js');

const xml2js = require('xml2js');
const pack = require('../../package.json');

const retry = require('./retry.js');
const isLiveStream = require('./isLiveStream.js');
const testHomepageConnection = require('./testHomepageConnection.js');
const usedTypes = require('./usedTypes.js');


const SCRAPE_URL = 'http://dir.xiph.org/yp.xml';

/**
 * Downloads the Icecast directory, validates streams,
 * and inserts new stations into the database.
 *
 * @extends BaseStationProcessor
 */
class IcecastDBScraper extends BaseStationProcessor {

  pulledCount = 0;

  /**
   * Called before processing begins.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.scrapeTimeout);

    try {
      const res = await fetch(SCRAPE_URL, {
        headers: {
          'User-Agent': `radiotxt.site/${pack.version}`
        },
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

      const text = await res.text();
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(text);
      const stations = result?.directory?.entry;
      if (!stations) {
        throw new Error('no stations returned');
      }

      await this.mongo.stashStations(stations);
      this.pulledCount = stations.length;
    } catch(err) {
      if (err.name === 'AbortError') {
        throw new Error(`Icecast directory request timed out after ${this.scrapeTimeout}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Total number of stations that will be processed.
   *
   * @returns {number}
   */
  get total() {
    return this.pulledCount;
  }

  /**
   * Retrieves a batch of stations.
   *
   * @param {number} limit
   * @param {number} offset
   * 
   * @returns {Promise<Object[]>}
   */
  async getBatch(limit, offset) {
    const result = await this.mongo.getPaginatedStations(limit, offset);
    return result.stations;
  }

  /**
   * Processes a single station.
   *
   * Called once for every station returned by getBatch().
   *
   * @param {Object} station
   * 
   * @returns {Promise<void>}
   */
  async processStation(station) {
    const started = Date.now();

    const url = station.listen_url?.[0];

    this.emit('stationStart', {
      id: station.id,
      url
    });

    try {
      if (!url) return;

      if (await this.stations.exists(url)) {
        return;
      }

      const stream = await retry(() => isLiveStream(url));

      if (!stream.ok) return;

      if (!usedTypes.includes(stream.content)) return;

      const result = await this.stations.addStation({

          name: stream.name ||
            station.server_name?.[0] ||
            stream.description,

          url: stream.url,

          genre: stream.icyGenre ||
            station.genre?.[0] ||
            'Unknown',

          online: stream.isLive,

          'content-type': stream.content,

          bitrate: stream.bitrate || 0,

          icon: 'Unknown',

          homepage: await retry(() =>
              testHomepageConnection(
                stream.icyurl
              )
            ) || 'Unknown',

          error: '',
          duplicate: false
        });

      if (result === false) {
        return;
      }

      this.changed++;

      this.emit('stationAdded', {
        id: result,
        url: stream.url,
        stream,
        duration: Date.now() - started
      });
    } catch(err) {
      this.emit('stationError', {
        id: station.id,
        url,
        error: err,
        duration: Date.now() - started
      });
    } finally {
      this.counter++;
      this.emitProgress();
    }
  }

  /**
   * Called after all stations have been processed.
   *
   * @param {Object} start Starting database statistics.
   * @param {Object} end Ending database statistics.
   * 
   * @returns {Promise<void>}
   */
  async complete(start, end) {
    await this.mongo.logDBUpdateResults(this.changed, start, end, 'scrape');
  }

  /**
   * Called after processing completes, even if an error occurs.
   *
   * @returns {Promise<void>}
   */
  async cleanup() {
    await this.mongo.clearStash();
  }
}


module.exports = IcecastDBScraper;