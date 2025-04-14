import debounce from '../utils/debounce.js';
import createStationElement from './helpers/createStationElement.js';

const ELEMENT_HEIGHT = 58;
const SCROLL_THRESHOLD = 0.7;

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

  constructor(list, container, player, scrollFunc) {
    this._list = list;
    this._container = container;
    this._player = player;
    this._scrollFunc = scrollFunc;

    // bind this to the class instance
    this._resizeHandler = this._onResize.bind(this);
    this._scrollHandler = this._onScroll.bind(this);
    this._debouncedLoad = debounce(this._load.bind(this), 100);

    const parent = this._container.parentElement; 
    parent.addEventListener('scroll', this._scrollHandler);
    window.addEventListener('resize', this._resizeHandler);
    this._load();
  }
  
  /**
   * user scrolled the parent container
   */
  _onScroll() {
    const parent = this._container.parentElement; 
    if (this._scrollFunc && typeof this._scrollFunc === 'function') this._scrollFunc(parent);
    if (parent.scrollTop / (parent.scrollHeight - parent.clientHeight) >= this._scrollThreshold) {
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
      const stationElement = createStationElement(element, this._player);
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
      const stations = this._list.slice(this._ndx, this._ndx + this._pullNumber);
      this._populateContainer(stations);
      this._ndx += this._pullNumber;    
    } catch(e) {
      console.error(`Error loading items: ${e}`);
    } finally {
      this._loading = false;
    }
  }

  /**
   * remove listeners for da memoryz
   */
  destroy() {
    window.removeEventListener('resize', this._resizeHandler);
    const parent = this._container.parentElement;
    parent.removeEventListener('scroll', this._scrollHandler);
  }
}