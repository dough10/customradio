import EventManager from '../utils/EventManager/EventManager.js';
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
    this._container = container;
    this._player = player;
    this._scrollFunc = scrollFunc;
    this._parent = this._container.parentElement;
    this._createStationElement = createElFunc || createStationElement;
    this._insertLoadingAnimation = loadingAnimation || insertLoadingAnimation;

    // console.log(`array length: ${list.length}, total pulls: ${(list.length / this._pullNumber)}`);

    // bind this to the class instance
    this._resizeHandler = this._onResize.bind(this);
    this._scrollHandler = this._onScroll.bind(this);
    this._debouncedLoad = debounce(this._load.bind(this), 100);

    if (!this._container || !this._container.parentElement) {
      throw new Error('LazyLoader: container must exist and have a parent element.');
    }
    
    this._em = new EventManager();

    this._em.add(this._parent, 'scroll', this._scrollHandler, { passive: true });
    this._em.add(window, 'resize', this._resizeHandler, { passive: true });

    this._load();
  }
  
  /**
   * user scrolled the parent container
   * 
   * @private
   * @function
   */
  _onScroll() {
    // pass the scroll event to the scroll function if it exists
    this._scrollFunc?.(this._parent.scrollTop);
  
    const remainingScroll = this._parent.scrollHeight - this._parent.scrollTop - this._parent.clientHeight;
  
    // if the user scrolled to the bottom of the container, load more elements
    const loadThreshold = (ELEMENT_HEIGHT * 4) + LI_BOTTOM_MARGIN;
    if (remainingScroll <= loadThreshold) {
      this._load();
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
    stationList.forEach(element => {
      const stationElement = this._createStationElement(element, this._player);
      if (element.selected) stationElement.toggleAttribute('selected');
      localFragment.append(stationElement);
    });
    this._container.append(localFragment);
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
    this._loading ? this._insertLoadingAnimation(this._container) : this._container.querySelector('.loading')?.remove();
  }

  /**
   * push more elements
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  _load() {
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
    // console.log(`array length: ${newList.length}, total pulls: ${(newList.length / this._pullNumber)}`);
    this._load();
  }  

  /**
   * remove listeners for da memoryz
   * 
   * @public
   * @function
   */
  destroy() {
    this._em.removeAll();
    this._parent = null;
    this._container = null;
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