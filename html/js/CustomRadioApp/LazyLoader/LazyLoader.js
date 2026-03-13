import EventManager from '../EventManager/EventManager.js';
import insertLoadingAnimation from '../UIManager/helpers/insertLoadingAnimation.js';

import debounce from '../utils/debounce.js';
import createStationElement from './helpers/createStationElement.js';

const ELEMENT_HEIGHT = 58;
const LI_BOTTOM_MARGIN = 180;

/**
 * calculate how many station elements can fit in the current browser window height
 * 
 * @public
 * @function
 * 
 * @returns {Number} number of elements that will fit in browser window height
 */
function getPullCount() {
  return Math.round(window.innerHeight / ELEMENT_HEIGHT);
}

/**
 * load more stations to the UI when user scrolls to the end of loaded content
 * 
 * @class
 * 
 * @param {Array} list list of stations
 * @param {HTMLElement} container container to append elements
 * @param {Class} player AudioPlayer.js instance
 * @param {Function} scrollFunc scroll callback function
 * 
 * @returns {void} 
 */
export default class LazyLoader {
  _ndx = 0;
  _pullNumber = getPullCount();
  _loading = false;

  constructor(list, container, player, scrollFunc, createElFunc, loadingAnimation) {
    this._list = list;
    
    this.$container = container;
    this.$parent = this.$container.parentElement;
    
    this._scrollFunc = scrollFunc;
    
    this._player = player;

    this._createStationElement = createElFunc || createStationElement;
    this._insertLoadingAnimation = loadingAnimation || insertLoadingAnimation;

    // bind this to the class instance
    this._debouncedLoad = debounce(_ => this.load(), 100);

    if (!this.$container || !this.$container.parentElement) {
      throw new Error('LazyLoader: container must exist and have a parent element.');
    }
    
    this._em = new EventManager();

    const listeners = [
      { 
        type: this._em.types.scroll, 
        handler: _ => this._onScroll(),
        options: { passive: true },
        target: this.$parent,
      }, { 
        type: this._em.types.resize,
        handler: _ => this._onResize(),
        options: { passive: true },
        target: window,
      },
    ];

    for (const {type, handler, options, target} of listeners) {
      this._em.add(target, type, handler, options);
    }

    this.load();
  }

  /**
   * returns the current pull count (number of items loaded per scroll)
   * 
   * @public
   * @readonly
   * 
   * @type {Number}
   * @return {Number} current pull count
   */
  get pullCount() {
    return this._pullNumber;
  }
  
  /**
   * user scrolled the parent container
   * 
   * @private
   * @function
   */
  _onScroll() {
    // pass the scroll event to the scroll function if it exists
    this._scrollFunc?.(this.$parent.scrollTop);
  
    const remainingScroll = this.$parent.scrollHeight - this.$parent.scrollTop - this.$parent.clientHeight;
  
    // if the user scrolled to the bottom of the container, load more elements
    const loadThreshold = (ELEMENT_HEIGHT * 4) + LI_BOTTOM_MARGIN;
    if (remainingScroll <= loadThreshold) {
      this.load();
    }
  }

  /**
   * window was resized by user
   * will adjust the pull count based on screen size
   * 
   * @private
   * @function
   */
  _onResize() {
    const adjusted = getPullCount();
    if (adjusted <= this._pullNumber) return;
    this._pullNumber = adjusted;
    this._debouncedLoad();
  }

  /**
   * Populates a container with station elements
   * 
   * @private
   * @function
   * 
   * @param {HTMLElement} container - The container to populate.
   * @param {Array} stationList - The list of stations to add.
   */
  _populateContainer(stationList) {
    const localFragment = document.createDocumentFragment();
    stationList.forEach(stationsData => {
      const $stationElement = this._createStationElement(stationsData, this._player);
      if (!$stationElement) return;
      if (stationsData.selected) $stationElement.toggleAttribute('selected');
      localFragment.append($stationElement);
    });
    this.$container.append(localFragment);
  }

  /**
   * toggle loading state
   * 
   * @param {Boolean} [state] - If true, loading state is set to true, otherwise toggled.
   * 
   * @returns {void}
   */
  _setLoading(state) {
    if (typeof state !== 'boolean') {
      state = !this._loading;
    }
    if (state === this._loading) return; // no change, do nothing
    this._loading = Boolean(state);
    if (this._ndx == 0) return;
    this._loading ? this._insertLoadingAnimation(this.$container) : this.$container.querySelector('.loading')?.remove();
  }

  /**
   * push more elements
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  load() {
    if (this._loading || this._ndx >= this._list.length) return;
    this._setLoading(true);
    try{
      // double pull count for first pull
      const pullCount = this._ndx ? this._pullNumber : this._pullNumber * 2;

      // if the pull count is greater than the remaining items, adjust it
      const safeStop = Math.min(this._ndx + pullCount, this._list.length);

      // slice the list to get the next set of items
      const stations = this._list.slice(this._ndx, safeStop);
      this._populateContainer(stations);

      // update the index for the next pull
      this._ndx += pullCount;    
    } catch(e) {
      console.error('Error loading items', e);
    } finally {
      this._setLoading(false);
    }
  }

  /**
   * resets LazyLoader to initial state
   * 
   * @public
   * @function
   * 
   * @param {Array} newList 
   */
  reset(newList = []) {
    this._list = newList;
    this._ndx = 0;
    this._pullNumber = getPullCount();
    this.load();
  }  

  /**
   * remove listeners for da memoryz
   * 
   * @public
   * @function
   */
  destroy() {
    this._em.removeAll();
    this.$parent = null;
    this.$container = null;
    this._list = null;
    this._player = null;
    this._scrollFunc = null;
    this._createStationElement = null;
    this._resizeHandler = null;
    this._scrollHandler = null;
    this._debouncedLoad = null;
    this._em = null;
    this._loading = false;
    this._ndx = 0;
    this._pullNumber = 0;
    console.log('LazyLoader destroyed');
  }
}