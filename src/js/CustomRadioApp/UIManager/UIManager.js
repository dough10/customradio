import Analytics from './helpers/Analytics.js';
import {initDialogInteractions, destroyDialogInteractions} from './helpers/dialog.js';
import insertLoadingAnimation from './helpers/insertLoadingAnimation.js';
import downloadTextfile from './helpers/downloadTextfile.js';
import CollapsingHeader from './CollapsingHeader/CollapsingHeader.js';
import toggleActiveState from '../utils/toggleActiveState.js';
import { t } from '../utils/i18n.js';

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
    this.toggleDisplayOnScroll = this.toggleDisplayOnScroll.bind(this);
    this.header = new CollapsingHeader();
  }
  
  /**
   * attach UI listeners
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
    dlButton.addEventListener('click', downloadTextfile);
  }

  /**
   * remove UI listeners
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
    dlButton.removeEventListener('click', downloadTextfile);
  }

  /**
   * scroll to top of page if user focuses input while sctolltop not = 0
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
   * @param {HTMLElement} parent 
   */
  toggleDisplayOnScroll(parent) {
    this.header.scroll(parent.scrollTop);
    if (parent.scrollTop < this._lastTop) {
      this._toTop.classList.add('hidden');
    } else if (parent.scrollTop > 0) {
      this._toTop.classList.remove('hidden');
    } else {
      this._toTop.classList.add('hidden');
    }
    this._lastTop = parent.scrollTop;
  }

  /**
   * sets the station counts in the UI
   * 
   * @param {Number} selected 
   * @param {Number} total 
   */
  setCounts(selected, total) {
    toggleActiveState(document.querySelector(this._selectors.downloadButton), selected);
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.textContent = t('stations', total);
  }

  /**
   * gets the current genres from the UI
   * 
   * @returns {Array} list of genres
   */
  currentGenres() {
    const parent = document.querySelector(this._selectors.genres);
    const options = Array.from(parent.querySelectorAll('option'));
    return options.map(element => element.value);
  }

  /**
   * loads genres into a datalist element
   */
  async loadGenres(genres) {
    const options = genres.map(createOption);
    document.querySelector(this._selectors.genres).replaceChildren(...options);
  }

  /**
   * scrolls to the top of the page
   */
  _toTopHandler() {
    const wrapper = document.querySelector(this._selectors.wrapper);
    wrapper.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * creates a loading animation in the given element
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
   */
  loadingEnd() {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.style.removeProperty('display');
  }

  /**
   * toggle visability of selected element
   */
  toggleSelectedVisability() {
    const selected = document.querySelectorAll('#stations>li[selected]');
    const current = selected[0].style.display;
    selected.forEach(el => {
      if (current === 'none') {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  }
}
