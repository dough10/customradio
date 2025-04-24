import Analytics from './helpers/Analytics.js';
import AudioPlayer from './AudioPlayer/AudioPlayer.js';
import CollapsingHeader from './CollapsingHeader/CollapsingHeader.js';
import Notifications from '../Notifications/Notifications.js';
import EventManager from '../utils/EventManager/EventManager.js';

import {initDialogInteractions, destroyDialogInteractions} from './helpers/dialog.js';
import insertLoadingAnimation from './helpers/insertLoadingAnimation.js';
import downloadTextfile from './helpers/downloadTextfile.js';
import toggleActiveState from '../utils/toggleActiveState.js';
import { t } from '../utils/i18n.js';
import hapticFeedback from '../utils/hapticFeedback.js';
import selectors from '../selectors.js';

/**
 * manages UI elements
 */
export default class UIManager {
  constructor() {
    this._lastTop = 0;
    this._toTop = document.querySelector(selectors.toTop);
    this.onScroll = this.onScroll.bind(this);
    this._header = new CollapsingHeader();
    this._notifications = new Notifications();
    this._player = new AudioPlayer(this._notifications);
    this._em = new EventManager();
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

    this._player.init();

    const filter = this._filter;
    this._em.add(filter, 'change', onFilterChange, { passive: true });
    this._em.add(filter, 'focus', this._filterFocus.bind(this), { passive: true });
    this._em.add(this._resetButton, 'click', onReset, { passive: true });
    this._em.add(this._toTop, 'click', this._toTopHandler.bind(this), { passive: true });
    this._em.add(this._downloadButton, 'click', this._dl, { passive: true });
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
  detachListeners() {
    this._analytics.destroy();

    this._player.destroy();

    this._header.destroy();

    destroyDialogInteractions();

    this._em.removeAll();

    console.log('UIManager: listeners removed');
  }

  /**
   * querySelector for genre filter input element
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _filter() {
    return document.querySelector(selectors.filter);
  }

  /**
   * qs for download button
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _downloadButton() {
    return document.querySelector(selectors.downloadButton);
  }

  /**
   * querySelector for 'station count' element
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _stationCount() {
    return document.querySelector(selectors.stationCount);
  }

  /**
   * querySelector for 'reset' button
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _resetButton() {
    return document.querySelector(selectors.resetButton);
  }

  /**
   * querySelector for 'main' element
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _main() {
    return document.querySelector(selectors.main);
  }

  /**
   * exposes audio player instance
   * 
   * @public
   * @readonly
   * @type {AudioPlayer}
   * @return {AudioPlayer}
   */
  get audioPlayer() {
    return this._player;
  }

  /**
   * exposes CollapsingHeader instance
   * 
   * @public
   * @readonly
   * @type {CollapsingHeader}
   * @return {CollapsingHeader}
   */
  get header() {
    return this._header;
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
    const wrapper = this._main;
    if (document.activeElement === ev.target && wrapper.scrollTop !== 0) {
      wrapper.scrollTop = 0;
    }
  }

  /**
   * calls header.scroll() to update the header
   * toggles the display of the "to top" button on scroll
   * 
   * @public
   * @function 
   * 
   * @param {HTMLElement} parent 
   */
  onScroll(scrollTop) {
    this._header.scroll(scrollTop);
  
    const atTop = scrollTop === 0;
    // const scrollingUp = scrollTop < this._lastTop;
  
    if (atTop) {
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
    toggleActiveState(this._downloadButton, selected);
    this._stationCount.textContent = t('stations', selected + total);
  }

  /**
   * gets a list of the current genres from the UI
   * 
   * @public
   * @function
   * 
   * @returns {Array<String>} List of normalized genre values
   */
  currentGenres() {
    const parent = document.querySelector(selectors.genres);
    const options = Array.from(parent.querySelectorAll('option'));
    return options.map(element => element.value);
  }

  /**
   * replaces the genres in the dataset with the given list
   * 
   * @public
   * @function
   */
  async loadGenres(genres) {
    const options = genres.map(createOption);
    document.querySelector(selectors.genres).replaceChildren(...options);
  }

  /**
   * scrolls to the top of the page
   * 
   * @private
   * @function
   */
  _toTopHandler() {
    hapticFeedback();
    const wrapper = this._main;
    wrapper.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * creates a loading animation in the given element
   * also hides the station count element
   * 
   * @public
   * @function
   * 
   * @param {HTMLElement} container - element to place a loadin animation
   */
  loadingStart(container) {
    insertLoadingAnimation(container);
    this._stationCount.style.display = 'none';
  }

  /**
   * removes the loading animation
   * also unhides the station count element
   * 
   * @public
   * @function
   */
  loadingEnd() {
    const loadingEl = document.querySelector(selectors.loading);
    if (loadingEl) loadingEl.remove();
    this._stationCount.style.removeProperty('display');
  }

  /**
   * toggle visability of selected elements
   * 
   * @public
   * @function
   */
  toggleSelectedVisability() {
    const selected = document.querySelectorAll(selectors.selectedStation);
    const current = selected[0].style.display;
    selected.forEach(el => {
      el.style.display = current === 'none' ? 'flex' : 'none';
    });
  }
}


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