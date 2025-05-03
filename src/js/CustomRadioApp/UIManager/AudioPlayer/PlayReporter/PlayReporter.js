import _OPTIONS from '../../../utils/post_options.js';
import updateCsrf from '../../../utils/updateCsrf.js';
import retry from '../../../utils/retry.js';

export const REPORTING_INTERVAL = 1;

const CONFIG = {
  REPORT_ENDPOINT: id => `/reportPlay/${encodeURIComponent(id)}`,
  IDLE_TIMEOUT: 2000,
  INTERVAL: minsToMs(REPORTING_INTERVAL),
  REPORT_ATTEMPTS: 2
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
 * Reports play events after a specified duration
 */
export default class PlayReporter {
  /** @type {number} Timer ID for the play report timeout */
  _intervalID = 0;
  
  /** @type {string} Station ID being reported */
  _stationId;
  
  /** @type {Number} time until station is reported as played in ms */
  _interval = CONFIG.INTERVAL;

  /** @typedef {'idle'|'reporting'|'stopped'} ReporterState */
  _state = 'idle';

  _reportAttempts = 0;
  
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
    if (this._state === 'stopped') return;
    this._state = 'reporting';
    requestIdleCallback(async (deadline) => {
      try {
        if (deadline.timeRemaining() > 0) {
          const url = CONFIG.REPORT_ENDPOINT(this._stationId);
          const res = await retry(() => fetch(url, _OPTIONS()));
          if (res?.status === 403 && this._reportAttempts < CONFIG.REPORT_ATTEMPTS) {
            this._reportAttempts++;
            const success = await updateCsrf();
            if (success) requestIdleCallback(this._reportPlay.bind(this));
          }
        } else {
          requestIdleCallback(this._reportPlay.bind(this));
        }
      } catch (error) {
        this._reportAttempts = 0;
        console.warn('Play report failed:', error);
      } finally {
        this._state = 'idle';
      }
    }, { timeout: CONFIG.IDLE_TIMEOUT });
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
    this._state = 'stopped';
  }

  /**
   * Cleans up resources when instance is destroyed
   * 
   * @public
   */
  destroy() {
    this.playStopped();
    this._stationId = null;
    this._interval = null;
  }
}