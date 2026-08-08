const EventEmitter = require('events');
const pLimit = require('p-limit');

const Stations = require('../model/Stations.js');
const Mongo = require('../model/Mongo.js');

const msToHhMmSs = require('./msToHhMmSs.js');
const mb = require('./mb.js');

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_SCRAPE_TIMEOUT = 20000;

/**
 * Base class for processing radio stations in batches.
 *
 * Handles:
 * - batching
 * - concurrency limiting
 * - progress reporting
 * - timing
 * - lifecycle events
 *
 * Subclasses are responsible for implementing the data source and
 * station-specific processing by overriding the lifecycle methods.
 *
 * @extends EventEmitter
 */
class BaseStationProcessor extends EventEmitter {

  /**
   * Creates a new station processor.
   *
   * @param {Stations} stations Station database instance.
   * @param {Mongo} mongo MongoDB helper instance.
   * @param {Object} [options={}] Processor options.
   * @param {number} [options.batchSize=100]
   * Number of stations processed per batch.
   * @param {number} [options.concurrency=5]
   * Maximum number of stations processed concurrently.
   * @param {number} [options.scrapeTimeout=20000]
   * Timeout in milliseconds used by scrapers when downloading station lists.
   */
  constructor(stations, mongo, options = {}) {
    super();
    options = options || {};

    if (!(stations instanceof Stations)) {
      throw new TypeError(
        'stations must be a instance of Stations class'
      );
    }

    if (!(mongo instanceof Mongo)) {
      throw new TypeError(
        'mongo must be an instance of Mongo class'
      );
    }

    this.stations = stations;
    this.mongo = mongo;

    this.batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
    this.concurrency = options.concurrency || DEFAULT_CONCURRENCY;
    this.scrapeTimeout = options.scrapeTimeout || DEFAULT_SCRAPE_TIMEOUT;

    this.running = false;

    this.startStats = null;
    this.startTime = null;

    this.limit = pLimit(this.concurrency);
    this.totalStations = 0;
    this.counter = 0;
    this.changed = 0;
  }

  /**
   * Number of stations remaining to process.
   *
   * @returns {number}
   */
  get remainingStations() {
    return this.totalStations - this.counter;
  }

  /**
   * Precentage of stations completed
   * 
   * @returns {number}
   */
  get completedPrecentage() {
    return this.totalStations === 0 ? 100 : Number(((this.counter / this.totalStations) * 100).toFixed(2));
  }

  /**
   * Resets the processor state before a new run.
   *
   * Clears any cached statistics and resets all runtime counters.
   *
   * @private
   * @returns {void}
   */
  #reset() {
    this.startStats = null;
    this.startTime = null;
    this.totalStations = 0;
    this.counter = 0;
    this.changed = 0;
  }

  /**
   * Returns the current Node.js process memory usage.
   *
   * Memory values are converted to megabytes for easier logging.
   *
   * @private
   * @returns {{
   *   heap: number,
   *   RSS: number
   * }}
   */
  #memoryUsage() {
    const { heapUsed, rss } = process.memoryUsage();
    return {
      heap: mb(heapUsed),
      RSS: mb(rss)
    };
  }

  /**
   * Emits a progress event containing runtime statistics.
   *
   * @param {Object} [extra={}]
   * Additional properties to include in the emitted progress event.
   */
  emitProgress(extra = {}) {
    const elapsed = this.startTime ? Date.now() - this.startTime : 0;
    let approxCompletion = null;
    let approxCompletionTime = null;

    if (this.counter >= 10 && elapsed > 0) {
      const stationsPerMs = this.counter / elapsed;
      const ms = this.remainingStations / stationsPerMs;
      approxCompletion = msToHhMmSs(ms);
      approxCompletionTime = new Date(Date.now() + ms).toLocaleTimeString();
    }

    this.emit('progress', {
      processed: this.counter,
      total: this.totalStations,
      remaining: this.remainingStations,
      runTime: msToHhMmSs(elapsed),
      changed: this.changed,
      approxCompletion,
      approxCompletionTime,
      percent: this.completedPrecentage,
      ...extra
    });
  }

  /**
   * Executes the processor.
   *
   * Workflow:
   * 1. initialize()
   * 2. determine total work
   * 3. process batches
   * 4. complete()
   * 5. cleanup() (always)
   *
   * @returns {Promise<boolean>}
   * Resolves to true if processing completed successfully;
   * otherwise false.
   */
  async run() {
    if (this.running) {
      return false;
    }

    this.running = true;
    this.#reset();

    try {
      await this.initialize();

      const start = this.startStats || await this.stations.dbStats();

      this.startTime = start.time;
      this.totalStations = this.total;
      const parts = Math.ceil(this.totalStations / this.batchSize);

      this.emit('start', {
        total: this.totalStations,
        totalBatches: parts,
        time: this.startTime,
        ...this.#memoryUsage()
      });

      for (let batch = 0; batch < parts; batch++) {
        const offset = batch * this.batchSize;
        const pulledStations = await this.getBatch(this.batchSize, offset);

        this.emit('batchStart', {
          batch: batch + 1,
          totalBatches: parts,
          batchCount: pulledStations.length,
          processed: this.counter,
          changed: this.changed,
          ...this.#memoryUsage(),
          time: Date.now()
        });

        await Promise.all(
          pulledStations.map(station =>
            this.limit(() => this.processStation(station))
          )
        );

        this.emit('batchComplete', {
          batch: batch + 1,
          totalBatches: parts,
          batchCount: pulledStations.length,
          processed: this.counter,
          changed: this.changed,
          ...this.#memoryUsage(),
          time: Date.now()
        });
      }

      const end = await this.stations.dbStats();

      await this.complete(start, end);

      this.emit('done', {
        changed: this.changed,
        processed: this.counter,
        duration: msToHhMmSs(end.time - start.time),
        start,
        end,
        ...this.#memoryUsage(),
        time: Date.now()
      });

      return true;
    } catch (err) {
      this.emit('error', err);
      return false;
    } finally {
      this.running = false;
      try {
        await this.cleanup();
      } catch (err) {
        this.emit('error', err);
      }
    }
  }

  /**
   * Called before processing begins.
   *
   * Override to perform initialization such as downloading
   * source data or caching database statistics.
   * 
   * @abstract
   *
   * @returns {Promise<void>}
   */
  async initialize() { }

  /**
   * Total number of stations that will be processed.
   *
   * Must be overridden by subclasses.
   * 
   * @abstract
   *
   * @returns {number}
   */
  get total() {
    return 0;
  }

  /**
   * Retrieves a batch of stations.
   * 
   * @abstract
   *
   * @param {number} limit
   * @param {number} offset
   * 
   * @returns {Promise<Object[]>}
   */
  async getBatch(limit, offset) {
    throw new Error(
      'getBatch() not implemented'
    );
  }

  /**
   * Processes a single station.
   *
   * Called once for every station returned by getBatch().
   * 
   * @abstract
   *
   * @param {Object} station
   * 
   * @returns {Promise<void>}
   */
  async processStation(station) {
    throw new Error(
      'processStation() not implemented'
    );
  }

  /**
   * Called after all stations have been processed.
   * 
   * @abstract
   *
   * @param {Object} start Starting database statistics.
   * @param {Object} end Ending database statistics.
   * 
   * @returns {Promise<void>}
   */
  async complete(start, end) { }

  /**
   * Called after processing completes, even if an error occurs.
   *
   * Override to release temporary resources.
   * 
   * @abstract
   *
   * @returns {Promise<void>}
   */
  async cleanup() { }

}


module.exports = BaseStationProcessor;