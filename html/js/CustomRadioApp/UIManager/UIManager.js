import AudioPlayer from './AudioPlayer/AudioPlayer.js';
import CollapsingHeader from './CollapsingHeader/CollapsingHeader.js';
import EventManager from '../EventManager/EventManager.js';
import Toast from '../Toast/Toast.js';

import { initDialogInteractions, destroyDialogInteractions } from './dialogs/dialog.js';
import insertLoadingAnimation from './helpers/insertLoadingAnimation.js';
import downloadTextfile from './helpers/downloadTextfile.js';
import sleep from '../utils/sleep.js';
import toggleActiveState from '../utils/toggleActiveState.js';
import { t } from '../utils/i18n.js';
import hapticFeedback from '../utils/hapticFeedback.js';
import selectors from '../selectors.js';

import showActiveAlerts from '../Alerts/alertHelpers.js';

import userMenu from './menu/menu.js';


/**
 * manages UI elements
 */
export default class UIManager {

  constructor(s) {
    this._selectors = s || selectors;
    this._player = new AudioPlayer();
    this._em = new EventManager();
    this._header = new CollapsingHeader();

    this.$toTop = document.querySelector(this._selectors.toTop);
    this.$filter = document.querySelector(this._selectors.filter);
    this.$downloadButton = document.querySelector(this._selectors.downloadButton);
    this.$stationCount = document.querySelector(this._selectors.stationCount);
    this.$resetButton = document.querySelector(this._selectors.resetButton);
    this.$userMenuButton = document.querySelector(this._selectors.userMenuButton);
    this.$main = document.querySelector(this._selectors.main);
    this.$toggleSelected = document.querySelector(this._selectors.toggleSelected);

    const required = [
      this.$toTop,
      this.$filter,
      this.$downloadButton,
      this.$stationCount,
      this.$userMenuButton,
      this.$main,
      this.$toggleSelected
    ];

    if (required.some(el => !el)) {
      throw new Error("Initialization failed — missing DOM elements.");
    }

    userMenu.loadUser(window.user);

    showActiveAlerts();
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
   * @return {void}
  */
  attachListeners({ onFilterChange, onReset }) {
    initDialogInteractions();
    this._player.init();

    const listeners = [
      {
        el: this.$toggleSelected,
        event: this._em.types.click,
        handler: _ => this.toggleSelectedVisibility()
      }, {
        el: this.$userMenuButton,
        event: this._em.types.click,
        handler: ev => userMenu.open(ev)
      }, {
        el: this.$filter,
        event: this._em.types.change,
        handler: onFilterChange
      }, {
        el: this.$filter,
        event: this._em.types.focus,
        handler: ev => this._filterFocus(ev)
      }, {
        el: this.$resetButton,
        event: this._em.types.click,
        handler: ev => {
          this._filterFocus(ev);
          onReset();
        }
      }, {
        el: this.$toTop,
        event: this._em.types.click,
        handler: _ => this._toTopHandler()
      }, {
        el: this.$downloadButton,
        event: this._em.types.click,
        handler: _ => this._dl()
      }
    ];

    for (const { el, event, handler } of listeners) {
      if (el) this._em.add(el, event, handler);
    }

    document.querySelectorAll('.menu-button').forEach(btn => {
      this._em.add(btn, this._em.types.click, _ => userMenu.close());
    });
  }

  /**
   * remove UI listeners
   * 
   * @public
   * @function
   * 
   * @return {void}
   */
  detachListeners() {
    destroyDialogInteractions();
    this._player.destroy();
    this._header.destroy();
    this._em.removeAll();
    console.log('UIManager: listeners removed');
  }

  /**
   * exposes audio player instance
   * 
   * @public
   * @readonly
   * 
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
   * 
   * @type {CollapsingHeader}
   * @return {CollapsingHeader}
   */
  get header() {
    return this._header;
  }

  /**
   * exposes LazyLoader instance
   * 
   * @public
   * @readonly
   * 
   * @type {LazyLoader}
   * @return {LazyLoader}
   */
  set lzldr(value) {
    this._lzldr = value;
  }

  /**
   * displays the share button if user is logged in and has selected stations
   * 
   * @public
   * @function
   * 
   * @return {void}
   */
  loadShareButton() {
    userMenu.loadShareButton();
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
   * scroll to top of page if user focuses input while scrollTop not = 0
   * 
   * @private
   * @function
   * 
   * @param {Event} ev
   * @return {void}
   */
  _filterFocus(ev) {
    if (document.activeElement === ev.target && this.$main.scrollTop !== 0) {
      this._toTopHandler();
    }
  }

  /**
   * calls header.scroll() to update the header
   * toggles the display of the "to top" button on scroll
   * 
   * @public
   * @function 
   * 
   * @param {Number} scrollTop
   * @return {void}
   */
  onScroll(scrollTop) {
    this._header.scroll(scrollTop);
    const closeToTop = scrollTop < (window.innerHeight * 0.2);
    closeToTop ? this.$toTop.classList.add('hidden') : this.$toTop.classList.remove('hidden');
  }


  /**
   * sets the station counts in the UI
   * 
   * @public
   * @function
   * 
   * @param {Number} selected 
   * @param {Number} total
   * @return {void}
   */
  setCounts(selected, total) {
    [
      this.$downloadButton,
      this.$toggleSelected
    ].filter(Boolean).forEach(el => toggleActiveState(el, selected));
    this.$stationCount.textContent = t('stations', total, selected);
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
    const parent = document.querySelector(this._selectors.genres);
    if (!parent) {
      console.error('Genres parent element is missing.');
      return [];
    }
    const options = Array.from(parent.querySelectorAll('option'));
    return options.map(element => element.value);
  }

  /**
   * replaces the genres in the dataset with the given list
   * 
   * @public
   * @function
   * 
   * @param {Array<String>} genres - list of genre values
   * @return {void}
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
   * 
   * @return {void}
   */
  _toTopHandler() {
    if (!this.$main) {
      console.error('Main wrapper element is missing.');
      return;
    }
    hapticFeedback();
    this.$main.scrollTo({
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
   * @param {HTMLElement} container - element to place a loading animation
   * @return {void}
   */
  loadingStart(container) {
    insertLoadingAnimation(container);
    this.$stationCount.parentElement.style.display = 'none';
  }

  /**
   * removes the loading animation
   * also unhides the station count element
   * 
   * @public
   * @function
   * 
   * @return {void}
   */
  loadingEnd() {
    const loadingEl = document.querySelector(this._selectors.loading);
    if (loadingEl) loadingEl.remove();
    this.$stationCount.parentElement.style.removeProperty('display');
  }

  /**
   * toggle visibility of selected elements
   * 
   * @public
   * @function
   * 
   * @return {void}
   */
  toggleSelectedVisibility() {
    const selected = document.querySelectorAll(this._selectors.selectedStation);
    if (!selected.length) return;
    this.$main.classList.toggle('hide-selected');
    const inWindow = document.querySelectorAll(this._selectors.stations).length;
    if (inWindow <= this._lzldr.pullCount * 2 && this._lzldr) {
      this._lzldr.load();
    }
  }
}


/**
 * creates a datalist option element
 * 
 * @param {String} str - value for the option
 * @returns {HTMLElement}
 */
function createOption(str) {
  const option = document.createElement('option');
  option.value = str;
  return option;
}