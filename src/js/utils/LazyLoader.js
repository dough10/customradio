import { createStationElement } from './createStationElement.js';

/**
 * calculate how many station elements can fit in the current browser window height
 * 
 * @returns {Number} number of elements that will fit in browser window height
 */
function getPullCount() {
  return Math.round(window.innerHeight / 58);
}

/**
 * load more stations to the UI when user scrolls to end of loaded content
 * 
 * @class
 * 
 * @param {Array} list list of stations
 * @param {HTMLElement} container container to append elements
 * @param {Class} player AudioPlayer.js instance
 * @param {Function} scrollFUnc scroll callback
 * 
 * @returns {void} 
 */
export default class LazyLoader {
  _ndx = 0;
  _pullNumber = getPullCount();
  _loading = false;
  _lastTop = 0;

  constructor(list , container, player, scrollFunc) {
    this._list = list;
    this._container = container;
    this._player = player;

    // adjust pull number if screen size changes
    window.addEventListener('resize', _ => {
      const adjusted = getPullCount();
      if (adjusted > pullNumber) {
        pullNumber = adjusted;
        this._load();
      }
    });

    const parent = container.parentElement; 

    parent.onscroll = _ => {
      if (scrollFunc && typeof scrollFunc === 'function') scrollFunc(this._lastTop);
      if (parent.scrollTop / (parent.scrollHeight - parent.clientHeight) >= 0.8) {
        this._load();
      }
      this._lastTop = parent.scrollTop;
    };

    this._load();
  }

  /**
   * push more elements
   * 
   * @returns {void}
   */
  _load() {
    if (this._loading || this._ndx >= this._list.length) return;
    this._loading = true;
    this._populateContainer(this._list.slice(this._ndx, this._ndx + this._pullNumber), this._container);
    this._ndx += this._pullNumber;
    this._loading = false;    
  }

  /**
   * populate container with station elements
   * 
   * @param {Array} stationList 
   * @param {HTMLElement} container 
   */
  _populateContainer(stationList, container) {
    const fragment = document.createDocumentFragment();
    stationList.forEach(station => {
      fragment.append(createStationElement(station, this._player));
    });
    container.append(fragment);
  }
}