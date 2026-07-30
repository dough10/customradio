const EventEmitter = require('events');
const pLimit = require('p-limit');

const retry = require('./retry.js');
const isLiveStream = require('./isLiveStream.js');
const testHomepageConnection = require('./testHomepageConnection.js');
const msToHhMmSs = require('./msToHhMmSs.js');

const UPDATE_PULL_COUNT = 100;

class DatabaseUpdater extends EventEmitter {
  constructor(options = {}, stations, mongo) {
    super();

    this.stations = stations; 
    this.mongo = mongo;

    this.batchSize = options.batchSize || UPDATE_PULL_COUNT;
    this.concurrency = options.concurrency || 5;

    this.limit = pLimit(this.concurrency);

    this.running = false;
    this.counter = 0;
    this.updatedCount = 0;
    this.totalStations = 0;
  }

  get remainingStations() {
    return this.totalStations - this.counter;
  }

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

    this.emit('start', {
      total: this.totalStations,
      started: start.time,
    });

    try {
      const parts = Math.ceil(this.totalStations / this.batchSize);

      for (let batch = 0; batch < parts; batch++) {
        const offset = batch * this.batchSize;

        const pulledStations = await this.stations.getPaginatedStations(
          this.batchSize,
          offset
        );

        this.emit('batchStart', {
          batch: batch + 1,
          totalBatches: parts,
          count: pulledStations.length,
        });

        await Promise.all(
          pulledStations.map(station =>
            this.limit(() => this.processStream(station, batch + 1, parts))
          )
        );

        this.emit('batchComplete', {
          batch: batch + 1,
          totalBatches: parts,
          processed: this.counter,
          updated: this.updatedCount
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

      this.emit('done', {
        processed: this.counter,
        updated: this.updatedCount,
        duration,
        start,
        end,
      });

      return true;
    } catch (err) {
      await this.mongo.logJSError(err);
      this.emit('error', err);
      return false;
    } finally {
      this.running = false;
      this.startTime = null;
    }
  }

  async processStream(station, batch, totalBatches) {
    const started = Date.now();

    this.emit('stationStart', {
      id: station.id,
      url: station.url,
      batch,
      totalBatches,
    });

    try {
      const stream = await retry(() => isLiveStream(station.url));

      if (this.stationDataIsUnchanged(station, stream)) {
        this.emit('stationUnchanged', {
          id: station.id,
          url: station.url,
          duration: Date.now() - started,
        });

        return;
      }

      await this.updateStationData(station, stream);

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

      let approxCompletion = null;

      if (this.counter >= 10) {
        const elapsed = Date.now() - this.startTime;
        const stationsPerMs = this.counter / elapsed;

        approxCompletion = msToHhMmSs(
          this.remainingStations / stationsPerMs
        );
      }

      this.emit('progress', {
        processed: this.counter,
        updated: this.updatedCount,
        total: this.totalStations,
        remaining: this.remainingStations,
        approxCompletion,
        percent:
          this.totalStations === 0
            ? 100
            : Number(
                ((this.counter / this.totalStations) * 100).toFixed(2)
              ),
      });
    }
  }

  async updateStationData(old, updated) {
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

  stationDataIsUnchanged(old, updated) {
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