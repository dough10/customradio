const EventEmitter = require('events');
const pLimit = require('p-limit');

const xml2js = require('xml2js');
const pack = require('../../package.json');

const Stations = require('../model/Stations.js');
const Mongo = require('../model/Mongo.js');

const retry = require('./retry.js');
const isLiveStream = require('./isLiveStream.js');
const testHomepageConnection = require('./testHomepageConnection.js');
const msToHhMmSs = require('./msToHhMmSs.js');
const usedTypes = require("./usedTypes.js");
const mb = require('./mb.js');

const SCRAPE_URL = 'http://dir.xiph.org/yp.xml';
const SCRAPE_TIME_OUT = 20000;
const SCRAPE_PULL_COUNT = 50;
const CONCURRENCY = 5;


class IcecastDBScraper extends EventEmitter {
  /**
   * 
   * @param {{}} [options={}] 
   * @param {Stations} stations 
   * @param {Mongo} mongo 
   */
  constructor(options={}, stations, mongo) {
    if (!(stations instanceof Stations)) throw new TypeError('stations must be a instance of Stations class');
    if (!(mongo instanceof Mongo)) throw new TypeError('mongo must be an instance of Mongo class');

    super();
    this.stations = stations;
    this.mongo = mongo;

    this.scrapeTimeout = options?.scrapeTimeout || SCRAPE_TIME_OUT;
    this.batchSize = options?.batchSize || SCRAPE_PULL_COUNT;
    this.concurrency = options?.concurrency || CONCURRENCY;
    
    this.limit = pLimit(this.concurrency);

    this.counter = 0;
    this.running = false;
    this.added = 0;
    this.totalStations = 0;
  }

  /**
   * unprocessed stations
   * 
   * @public
   * 
   * @returns {number}
   */
  get remainingStations() {
    return this.totalStations - this.counter;
  }

  /**
   * fetches stations from icecastdb and saves them to mongodb stash
   */
  async #getStations() {
    const controller = new AbortController();
    const timeout = this.scrapeTimeout;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const res = await fetch(SCRAPE_URL, {
        headers: {
          'User-Agent': `radiotxt.site/${pack.version}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }

      const text = await res.text();
      if (!text) throw new Error('response has no body');

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(text);

      const stations = result?.directory?.entry || null;

      if (!stations) throw new Error('no stations returned');

      await this.mongo.stashStations(stations);

      this.totalStations = stations.length;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * makes a get request to the stream url, if header data of online status has changed it updates the database
   * 
   * @private
   * 
   * @param {object} station 
   * @param {number} batch 
   * @param {number} totalBatches 
   * 
   * @emits stationStart
   * @emits stationAdded
   * @emits stationError
   * @emits progress
   * 
   * @returns {void}
   */
  async #processStream(station, batch, totalBatches) {
    const started = Date.now();

    const url = station.listen_url?.[0];

    this.emit('stationStart', {
      id: station.id,
      url,
      batch,
      totalBatches,
    });
    
    if (!url) return;

    try {
      if (await this.stations.exists(url)) return;

      const stream = await retry(() => isLiveStream(url));

      if (!stream.ok) return;

      if (!usedTypes.includes(stream.content)) return;

      const result = await this.stations.addStation({
        name: stream.name || station.server_name?.[0] || stream.description,
        url: stream.url,
        genre: stream.icyGenre || station.genre?.[0] || 'Unknown',
        online: stream.isLive,
        'content-type': stream.content,
        bitrate: stream.bitrate || 0,
        icon: 'Unknown',
        homepage: await retry(() => testHomepageConnection(stream.icyurl)) || 'Unknown',
        error: '',
        duplicate: false
      });

      if (result === false) return;

      this.added++;

      this.emit('stationAdded', {
        id: result,
        url: stream.url,
        stream,
        duration: Date.now() - started,
      });
    } catch(err) {
      this.emit('stationError', {
        id: station.id,
        name: station.name,
        url: station.url,
        error: err,
        duration: Date.now() - started,
      });
    } finally {
      this.counter++;
      const elapsed = Date.now() - this.startTime;

      let approxCompletion = null;
      let approxCompletionTime = null;

      if (this.counter >= 10) {
        const stationsPerMs = this.counter / elapsed;

        const ms = this.remainingStations / stationsPerMs;

        approxCompletion = msToHhMmSs(ms);
        
        const finish = Date.now() + ms;
        approxCompletionTime = new Date(finish).toLocaleTimeString();

      }

      this.emit('progress', {
        processed: this.counter,
        added: this.added,
        total: this.totalStations,
        remaining: this.remainingStations,
        runTime: msToHhMmSs(elapsed),
        approxCompletion,
        approxCompletionTime,
        percent:
          this.totalStations === 0
            ? 100
            : Number(
                ((this.counter / this.totalStations) * 100).toFixed(2)
              ),
      });
    }
  }

  /**
   * process all streams in database and update online status and headers
   * 
   * @public
   * 
   * @emits start
   * @emits batchStart
   * @emits batchComplete
   * @emits done
   * @emits error
   * @emits cleanup
   * 
   * @returns {boolean} successfull completion
   */
  async run() {
    if (this.running) {
      return false;
    }

    this.running = true;
    this.counter = 0;
    this.added = 0;

    try {
      await this.#getStations();

      const start = await this.stations.dbStats();
      this.startTime = start.time;
      
      const initialMem = process.memoryUsage();
      
      this.emit('start', {
        total: this.totalStations,
        started: this.startTime,
        heap: mb(initialMem.heapUsed),
        RSS: mb(initialMem.rss)
      });
      
      const parts = Math.ceil(this.totalStations / this.batchSize);

      for (let batch = 0; batch < parts; batch++) {
        const offset = batch * this.batchSize;

        const { stations: pulledStations } = await this.mongo.getPaginatedStations(
          this.batchSize,
          offset
        );

        const bsMem = process.memoryUsage();
        
        this.emit('batchStart', {
          batch: batch + 1,
          totalBatches: parts,
          count: pulledStations.length,
          heap: mb(bsMem.heapUsed),
          RSS: mb(bsMem.rss)
        });

        await Promise.all(
          pulledStations.map(station =>
            this.limit(() => this.#processStream(station, batch + 1, parts))
          )
        );

        const beMem = process.memoryUsage();

        this.emit('batchComplete', {
          batch: batch + 1,
          totalBatches: parts,
          processed: this.counter,
          added: this.added,
          heap: mb(beMem.heapUsed),
          RSS: mb(beMem.rss)
        });
      }

      const end = await this.stations.dbStats();
      const duration = msToHhMmSs(end.time - start.time);

      await this.mongo.logDBUpdateResults(
        this.added,
        start,
        end,
        'scrape'
      );

      const endMem = process.memoryUsage();
      
      this.emit('done', {
        processed: this.counter,
        added: this.added,
        duration,
        start,
        end,
        heap: mb(endMem.heapUsed),
        RSS: mb(endMem.rss)
      });

      return true;
    } catch(err) {
      this.emit('error', err);
      return false;
    } finally {
      this.running = false;
      this.startTime = null;
      this.emit('cleanup', await this.mongo.clearStash());
    }
  }
}

module.exports = IcecastDBScraper;