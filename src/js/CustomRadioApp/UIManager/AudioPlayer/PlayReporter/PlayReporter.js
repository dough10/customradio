/** Number of minutes that counts as a valid play */
export const COUNTS_AS_PLAY_MINUTES = 5;

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
  _timerID = 0;
  
  /** @type {string} Station ID being reported */
  _stationId;
  
  /** @type {Number} time until station is reported as played in ms */
  _timeout = minsToMs(COUNTS_AS_PLAY_MINUTES);
  
  /**
   * Creates a new PlayReporter instance
   * 
   * @param {string} id - Station ID to report
   */
  constructor(id) {
    this._stationId = id;
    this._timerID = setTimeout(() => {
      this._reportPlay();
    }, this._timeout);
  }

  /**
   * Reports the play event
   * 
   * @private
   */
  async _reportPlay() {
    const res = await fetch(`/reportPlay/${this._stationId}`);
    if (!res.ok) {
      console.error(`Failed to report play: ${this._stationId}`);
    }
  }

  /**
   * Stops the play reporter and cleans up
   * 
   * @public
   */
  playStopped() {
    if (this._timerID) {
      clearTimeout(this._timerID);
      this._timerID = 0;
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