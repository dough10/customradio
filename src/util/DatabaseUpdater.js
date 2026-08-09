const BaseStationProcessor = require('./BaseStationProcessor.js');

const retry = require('./retry.js');
const isLiveStream = require('./isLiveStream.js');
const testHomepageConnection = require('./testHomepageConnection.js');

/**
 * Updates existing stations by checking whether their
 * stream metadata has changed.
 *
 * @extends BaseStationProcessor
 */
class DatabaseUpdater extends BaseStationProcessor {

  /**
   * Called before processing begins.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    this.startStats = await this.stations.dbStats();
  }

  /**
   * Total number of stations that will be processed.
   *
   * @returns {number}
   */
  get total() {
    return this.startStats.total;
  }

  /**
   * Retrieves a batch of stations.
   *
   * @param {number} limit
   * @param {number} offset
   * 
   * @returns {Promise<Array>}
   */
  async getBatch(limit, offset) {
    return this.stations.getPaginatedStations(
      limit,
      offset
    );
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

    try {
      const stream = await retry(() => isLiveStream(station.url));

      if (this.#stationDataIsUnchanged(station, stream)) {
        return;
      }

      await this.#updateStationData(
        station,
        stream
      );

      this.changed++;

      this.emit('stationUpdated', {
        id: station.id,
        stream,
        duration: Date.now() - started
      });
    } catch (err) {
      this.emit('stationError', {
        id: station.id,
        error: err
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
    await this.mongo.logDBUpdateResults(this.changed, start, end, 'update');
  }

  /**
   * Updates a station record with newly discovered metadata.
   *
   * @private
   * 
   * @param {Object} old Existing station.
   * @param {Object} updated Stream metadata.
   * 
   * @returns {Promise<void>}
   */
  async #updateStationData(old, updated) {
    const homepage = await retry(() =>
      testHomepageConnection(updated.icyurl)
    ).catch(() => null);

    await this.stations.updateStation({
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
    });
  }

  /**
   * Determines whether the fetched metadata differs from
   * the existing station.
   *
   * @private
   * 
   * @param {Object} old
   * @param {Object} updated
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