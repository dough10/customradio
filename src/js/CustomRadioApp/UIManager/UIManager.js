import Analytics from './helpers/Analytics.js';
import {initDialogInteractions, destroyDialogInteractions} from './helpers/dialog.js';
import insertLoadingAnimation from './helpers/insertLoadingAnimation.js';
import downloadTextfile from './helpers/downloadTextfile.js';
import CollapsingHeader from './CollapsingHeader/CollapsingHeader.js';
import toggleActiveState from '../utils/toggleActiveState.js';
import { t } from '../utils/i18n.js';
import hapticFeedback from '../utils/hapticFeedback.js';

/**
 * creates a datalist option element
 * 
 * @param {String} str 
 * 
 * @returns {HTMLElement}
 */
function createOption(str) {
  const option = document.createElement('option');
  option.value = str;
  return option;
}

/**
 * manages UI elements
 */
export default class UIManager {
  constructor(selectors) {
    this._selectors = selectors;
    this._lastTop = 0;
    this._toTop = document.querySelector(this._selectors.toTop);
    this.onScroll = this.onScroll.bind(this);
    this.header = new CollapsingHeader();
  }
  
  /**
   * attach UI listeners
   * 
   * @public
   * @function
   * 
   * @param {Object} param0
   * @param {Function} param0.onFilterChange
   * @param {Function} param0.onReset 
  */
 attachListeners({ onFilterChange, onReset }) {
    this._analytics = new Analytics();

    initDialogInteractions();

    const filter = document.querySelector(this._selectors.filter);
    filter.addEventListener('change', onFilterChange);
    filter.addEventListener('focus', this._filterFocus.bind(this));

    const resetButton = document.querySelector(this._selectors.resetButton);
    resetButton.addEventListener('click', onReset);

    this._toTop.addEventListener('click', this._toTopHandler.bind(this));

    const dlButton = document.querySelector(this._selectors.downloadButton);
    dlButton.addEventListener('click', this._dl);

    // document.addEventListener('keydown', this._keyDown.bind(this));    
  }

  /**
   * remove UI listeners
   * 
   * @public
   * @function
   * 
   * @param {Object} param0
   * @param {Function} param0.onFilterChange
   * @param {Function} param0.onReset 
   */
  detachListeners({ onFilterChange, onReset }) {
    this._analytics.destroy();

    this.header.destroy();

    destroyDialogInteractions();

    const filter = document.querySelector(this._selectors.filter);
    filter.removeEventListener('change', onFilterChange);
    filter.removeEventListener('focus', this._filterFocus.bind(this));

    const resetButton = document.querySelector(this._selectors.resetButton);
    resetButton.removeEventListener('click', onReset);

    this._toTop.removeEventListener('click', this._toTopHandler.bind(this));

    const dlButton = document.querySelector(this._selectors.downloadButton);
    dlButton.removeEventListener('click', this._dl);

    // document.addEventListener('keydown', this._keyDown.bind(this));
  }

  /**
   * downloads the current station list as a text file
   * 
   * @private
   * @function
   */
  _dl() {
    hapticFeedback();
    downloadTextfile();
  }

  /**
   * listen for alt + ˙ key
   * 
   * @private
   * @function
   * 
   * @param {Event} event 
   */
  _keyDown(event) {
    if (event.altKey && event.key.toLowerCase() === '˙') {
      this.toggleSelectedVisability();
    }
  }

  /**
   * scroll to top of page if user focuses input while sctolltop not = 0
   * 
   * @private
   * @function
   * 
   * @param {Event} ev 
   */
  _filterFocus(ev) {
    const wrapper = document.querySelector(this._selectors.wrapper);
    if (document.activeElement === ev.target && wrapper.scrollTop !== 0) {
      wrapper.scrollTop = 0;
    }
  }

  /**
   * toggles the display of the "to top" button on scroll
   * 
   * @public
   * @function 
   * 
   * @param {HTMLElement} parent 
   */
  onScroll(parent) {
    const scrollTop = parent.scrollTop;
    this.header.scroll(scrollTop);
  
    const atTop = scrollTop === 0;
    const scrollingUp = scrollTop < this._lastTop;
  
    if (atTop || scrollingUp) {
      this._toTop.classList.add('hidden');
    } else {
      this._toTop.classList.remove('hidden');
    }
  
    this._lastTop = scrollTop;
  }
  

  /**
   * sets the station counts in the UI
   * 
   * @public
   * @function
   * 
   * @param {Number} selected 
   * @param {Number} total 
   */
  setCounts(selected, total) {
    const button = document.querySelector(this._selectors.downloadButton);
    toggleActiveState(button, selected);
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.textContent = t('stations', selected + total);
  }

  /**
   * gets the current genres from the UI
   * 
   * @public
   * @function
   * 
   * @returns {Array<String>} List of normalized genre values
   */
  currentGenres() {
    const parent = document.querySelector(this._selectors.genres);
    const options = Array.from(parent.querySelectorAll('option'));
    return options.map(element => element.value);
  }

  /**
   * loads genres into a datalist element
   * 
   * @public
   * @function
   */
  async loadGenres(genres) {
    const options = genres.map(createOption);
    document.querySelector(this._selectors.genres).replaceChildren(...options);
  }

  /**
   * scrolls to the top of the page
   * 
   * @private
   * @function
   */
  _toTopHandler() {
    hapticFeedback();
    const wrapper = document.querySelector(this._selectors.wrapper);
    wrapper.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * creates a loading animation in the given element
   * 
   * @public
   * @function
   * 
   * @param {HTMLElement} container - element to place a loadin animation
   */
  loadingStart(container) {
    insertLoadingAnimation(container);
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.style.display = 'none';
  }

  /**
   * removes the loading animation
   * 
   * @public
   * @function
   */
  loadingEnd() {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.style.removeProperty('display');
  }

  /**
   * toggle visability of selected element
   * 
   * @public
   * @function
   */
  toggleSelectedVisability() {
    const selected = document.querySelectorAll('#stations>li[selected]');
    const current = selected[0].style.display;
    selected.forEach(el => {
      el.style.display = current === 'none' ? 'flex' : 'none';
    });
  }
}
