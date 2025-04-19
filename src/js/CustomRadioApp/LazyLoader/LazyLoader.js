import debounce from '../utils/debounce.js';
import createStationElement from './helpers/createStationElement.js';

const ELEMENT_HEIGHT = 58;
const SCROLL_THRESHOLD = 0.7;
const LI_BOTTOM_MARGIN = 180;

/**
 * calculate how many station elements can fit in the current browser window height
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
  _scrollThreshold = SCROLL_THRESHOLD;

  constructor(list, container, player, scrollFunc, createElFunc = createStationElement) {
    this._list = list;
    this._container = container;
    this._player = player;
    this._scrollFunc = scrollFunc;
    this._parent = this._container.parentElement;
    this._createStationElement = createElFunc;

    // console.log(`array length: ${list.length}, total pulls: ${(list.length / this._pullNumber) - 2}`);

    // bind this to the class instance
    this._resizeHandler = this._onResize.bind(this);
    this._scrollHandler = this._onScroll.bind(this);
    this._debouncedLoad = debounce(this._load.bind(this), 100);

    if (!this._parent) {
      throw new Error('LazyLoader: container must have a parent element.');
    }

    this._parent.addEventListener('scroll', this._scrollHandler, { passive: true });
    window.addEventListener('resize', this._resizeHandler);
    this._load();
  }
  
  /**
   * user scrolled the parent container
   */
  _onScroll() {
    this._scrollFunc?.(this._parent);
  
    const remainingScroll = this._parent.scrollHeight - this._parent.scrollTop - this._parent.clientHeight;
  
    if (remainingScroll <= (ELEMENT_HEIGHT * 4) + LI_BOTTOM_MARGIN) {
      this._load();
    }
  }

  /**
   * window was resized by user
   * will adjust the pull count based on screen size
   */
  _onResize() {
    const adjusted = getPullCount();
    if (adjusted > this._pullNumber) {
      this._pullNumber = adjusted;
      this._debouncedLoad();
    }
  }

  /**
   * Populates a container with station elements
   * 
   * @param {HTMLElement} container - The container to populate.
   * @param {Array} stationList - The list of stations to add.
   */
  _populateContainer(stationList) {
    const localFragment = document.createDocumentFragment();
    stationList.forEach(element => {
      const stationElement = this._createStationElement(element, this._player);
      if (element.selected) stationElement.toggleAttribute('selected');
      localFragment.append(stationElement);
    });
    this._container.append(localFragment);
  }

  /**
   * push more elements
   * 
   * @returns {void}
   */
  _load() {
    if (this._loading || this._ndx >= this._list.length) return;
    this._loading = true;
    try{
      // double pull count for first pull
      const pullCount = this._ndx ? this._pullNumber : this._pullNumber * 2;
      const stations = this._list.slice(this._ndx, this._ndx + pullCount);
      this._populateContainer(stations);
      this._ndx += pullCount;    
    } catch(e) {
      console.error('Error loading items', e);
    } finally {
      this._loading = false;
    }
  }

  /**
   * resets LazyLoader to initial state
   * 
   * @param {Array} newList 
   */
  reset(newList = []) {
    this._list = newList;
    this._ndx = 0;
    this._pullNumber = getPullCount();
    this._load();
  }  

  /**
   * remove listeners for da memoryz
   */
  destroy() {
    window.removeEventListener('resize', this._resizeHandler);
    this._parent.removeEventListener('scroll', this._scrollHandler);
  }
}