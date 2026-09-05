const EventEmitter = require('events');
const pLimit = require('p-limit');

const Stations = require('../model/Stations.js');
const Mongo = require('../model/Mongo.js');

const retry = require('./retry.js');
const isLiveStream = require('./isLiveStream.js');
const testHomepageConnection = require('./testHomepageConnection.js');
const msToHhMmSs = require('./msToHhMmSs.js');
const mb = require('./mb.js');

const UPDATE_PULL_COUNT = 100;
const CONCURRENCY = 5;

/**
 * runs through all database entrys and checks for changes.
 * 
 * @param {object} options batchSize=100 , concurrency=5
 * @param {Stations} stations instance of Stations class
 * @param {Mongo} mongo instance of Mongo class
 * 
 * @throws {TypeError} if stations is not instance of Stations class
 * @throws {TypeError} if mongo is not instance of Mongo class
 * 
 * @extends {EventEmitter}
 */
class DatabaseUpdater extends EventEmitter {
  constructor(options = {}, stations, mongo) {
    if (!(stations instanceof Stations)) throw new TypeError('stations must be a instance of Stations class');
    if (!(mongo instanceof Mongo)) throw new TypeError('mongo must be an instance of Mongo class');

    super();

    this.stations = stations; 
    this.mongo = mongo;

    this.batchSize = options?.batchSize || UPDATE_PULL_COUNT;
    this.concurrency = options?.concurrency || CONCURRENCY;

    this.limit = pLimit(this.concurrency);

    this.running = false;
    this.counter = 0;
    this.updatedCount = 0;
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
   * process all streams in database and update online status and headers
   * 
   * @public
   * 
   * @emits start
   * @emits batchStart
   * @emits batchComplete
   * @emits done
   * @emits error
   * 
   * @returns {boolean} successfull completion
   */
  async run() {
    if (this.running) {
      return false;
    }

    this.running = true;
    this.counter = 0;
    this.updatedCount = 0;

    const start = await this.stations.dbStats();
    this.startTime = start.time;
    this.totalStations = start.total;

    const initialMem = process.memoryUsage();

    this.emit('start', {
      total: this.totalStations,
      started: this.startTime,
      heap: mb(initialMem.heapUsed),
      RSS: mb(initialMem.rss)
    });

    try {
      const parts = Math.ceil(this.totalStations / this.batchSize);

      for (let batch = 0; batch < parts; batch++) {
        const offset = batch * this.batchSize;

        const pulledStations = await this.stations.getPaginatedStations(
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
          updated: this.updatedCount,
          heap: mb(beMem.heapUsed),
          RSS: mb(beMem.rss)
        });
      }

      const end = await this.stations.dbStats();
      const duration = msToHhMmSs(end.time - start.time);

      await this.mongo.logDBUpdateResults(
        this.updatedCount,
        start,
        end,
        'update'
      );

      const endMem = process.memoryUsage();
      
      this.emit('done', {
        processed: this.counter,
        updated: this.updatedCount,
        duration,
        start,
        end,
        heap: mb(endMem.heapUsed),
        RSS: mb(endMem.rss)
      });

      return true;
    } catch (err) {
      this.error = err;
      await this.mongo.logJSError(err);
      this.emit('error', err);
      return false;
    } finally {
      this.running = false;
      this.startTime = null;
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
   * @emits stationUnchanged
   * @emits stationUpdated
   * @emits stationError
   * @emits progress
   * 
   * @returns {void}
   */
  async #processStream(station, batch, totalBatches) {
    const started = Date.now();

    this.emit('stationStart', {
      id: station.id,
      url: station.url,
      batch,
      totalBatches,
    });

    try {
      const stream = await retry(() => isLiveStream(station.url));

      if (this.#stationDataIsUnchanged(station, stream)) {
        this.emit('stationUnchanged', {
          id: station.id,
          url: station.url,
          duration: Date.now() - started,
        });

        return;
      }

      await this.#updateStationData(station, stream);

      this.updatedCount++;

      this.emit('stationUpdated', {
        id: station.id,
        url: station.url,
        stream,
        duration: Date.now() - started,
      });
    } catch (err) {
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
        updated: this.updatedCount,
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
   * tests connection to any homepage url from header and saves the changes to the database
   * 
   * @private
   * 
   * @param {object} old 
   * @param {object} updated 
   */
  async #updateStationData(old, updated) {
    const homepage = await retry(() =>
      testHomepageConnection(updated.icyurl)
    ).catch(() => null);

    const updatedData = {
      id: old.id,
      name: updated.name || old.name,
      url: updated.url || old.url,
      genre:
        typeof updated.icyGenre === 'string'
          ? updated.icyGenre
          : old.genre || 'Unknown',
      online:
        typeof updated.isLive === 'boolean'
          ? updated.isLive
          : false,
      'content-type':
        updated.content || old['content-type'] || 'Unknown',
      bitrate: updated.bitrate || 0,
      icon: 'Unknown',
      homepage: homepage || old.homepage || 'Unknown',
      error: updated.error || '',
      duplicate: Boolean(old.duplicate),
      playMinutes: old.playMinutes,
      inList: old.inList,
    };

    await this.stations.updateStation(updatedData);
  }

  /**
   * checks for changes between the old and new data
   * 
   * @private
   * 
   * @param {object} old 
   * @param {object} updated 
   * 
   * @returns {boolean}
   */
  #stationDataIsUnchanged(old, updated) {
    return (
      old.name === (updated.name || old.name) &&
      old.url === (updated.url || old.url) &&
      old.genre === (updated.icyGenre || old.genre || 'Unknown') &&
      Boolean(old.online) === updated.isLive &&
      old.bitrate === (updated.bitrate || 0) &&
      old.homepage === (updated.homepage || old.homepage || 'Unknown') &&
      old.icon === (updated.icon || old.icon || 'Unknown')
    );
  }
}

module.exports = DatabaseUpdater;