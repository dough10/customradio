import _OPTIONS from '../../../utils/post_options.js';
import updateCsrf from '../../../utils/updateCsrf.js';
import retry from '../../../utils/retry.js';

export const REPORTING_INTERVAL = 1;

const CONFIG = {
  REPORT_ENDPOINT: id => `/reportPlay/${encodeURIComponent(id)}`,
  IDLE_TIMEOUT: 2000,
  REPORT_INTERVAL_MS: minsToMs(REPORTING_INTERVAL)
};

const STATES = Object.freeze({ IDLE: 'idle', REPORTING: 'reporting', STOPPED: 'stopped', PAUSED: 'paused' });

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
  _stationId = '0';
  
  /** @type {Number} time until station is reported as played in ms */
  _interval = CONFIG.REPORT_INTERVAL_MS;

  /** @typedef {'idle'|'reporting'|'stopped'|'paused'} ReporterState */
  _state = STATES.IDLE;

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
   * Initiates the play report process using requestIdleCallback
   * 
   * @private
   */
  _reportPlay() {
    if (this._state === STATES.STOPPED) return;
    this._state = STATES.REPORTING;

    requestIdleCallback((deadline) => {
      if (deadline.timeRemaining() > 0) {
        this._sendReport();
      } else {
        requestIdleCallback(this._reportPlay.bind(this));
      }
    }, { timeout: CONFIG.IDLE_TIMEOUT });
  }

  /**
   * Handles the actual fetch and retry logic
   * 
   * @private
   */
  async _sendReport() {
    if (this._state === STATES.STOPPED) return;
    try {
      const url = CONFIG.REPORT_ENDPOINT(this._stationId);
      const res = await retry(() => fetch(url, _OPTIONS()));

      if (res?.status !== 403) return;
      await updateCsrf();
    } catch (error) {
      console.warn('Play report failed:', error);
    } finally {
      if (this._state === STATES.STOPPED) return;
      this._state = STATES.IDLE;
    }
  }

  /**
   * pauses reporting without stopping
   */
  pause() {
    if (this._intervalID) {
      clearInterval(this._intervalID);
      this._intervalID = 0;
    }
    this._state = STATES.PAUSED;
  }

  /**
   * resumes reporting after pause
   * 
   * @returns {void}
   */
  resume() {
    if (this._intervalID) return;
    this._intervalID = setInterval(() => this._reportPlay(), this._interval);
    this._state = STATES.IDLE;
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
    this._state = STATES.STOPPED;
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