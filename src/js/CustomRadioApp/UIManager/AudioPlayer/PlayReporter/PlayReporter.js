export const REPORTING_INTERVAL = 1;

const CONFIG = {
  RETRY_ATTEMPTS: 3,
  REPORT_ENDPOINT: '/reportPlay'
};

/**
 * Converts minutes to milliseconds
 * 
 * @param {number} mins - Number of minutes to convert
 * 
 * @returns {number} Milliseconds
 * 
 * @throws {Error} If minutes is negative
 */
export function minsToMs(mins) {
  if (mins < 0) {
    throw new Error('Minutes cannot be negative');
  }
  return mins * 60 * 1000;
}

/**
 * retry function a given number of times
 * 
 * @param {Function} fn 
 * @param {Number} retries
 *  
 * @returns {Function}
 */
async function retry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) console.error(e);
    }
  }
}

/**
 * Reports play events after a specified duration
 */
export default class PlayReporter {
  /** @type {number} Timer ID for the play report timeout */
  _intervalID = 0;
  
  /** @type {string} Station ID being reported */
  _stationId;
  
  /** @type {Number} time until station is reported as played in ms */
  _interval = minsToMs(REPORTING_INTERVAL);
  
  /**
   * Creates a new PlayReporter instance
   * 
   * @param {string} id - Station ID to report
   */
  constructor(id) {
    this._stationId = id;
    this._intervalID = setInterval(() => this._reportPlay(), this._interval);
  }

  /**
   * Reports the play event
   * 
   * @private
   */
  async _reportPlay() {
    requestIdleCallback(async (deadline) => {
      try {
        if (deadline.timeRemaining() > 0) {
          const encodedId = encodeURIComponent(this._stationId);
          await retry(() => fetch(`/reportPlay/${encodedId}`));
        } else {
          this._scheduleReport();
        }
      } catch (error) {
        console.warn('Play report failed:', error);
      }
    }, { timeout: 2000 });
  }

  /**
   * Schedules the play report
   * 
   * @private
   */
  _scheduleReport() {
    requestIdleCallback(this._reportPlay.bind(this));
  }

  /**
   * Stops the play reporter and cleans up
   * 
   * @public
   */
  playStopped() {
    if (this._intervalID) {
      clearInterval(this._intervalID);
      this._intervalID = 0;
    }
  }

  /**
   * Cleans up resources when instance is destroyed
   * 
   * @public
   */
  destroy() {
    this.playStopped();
  }
}