import Analytics from './Analytics/Analytics.js';
import AudioPlayer from './AudioPlayer/AudioPlayer.js';
import CollapsingHeader from './CollapsingHeader/CollapsingHeader.js';
import EventManager from '../EventManager/EventManager.js';

import {initDialogInteractions, destroyDialogInteractions} from './dialogs/dialog.js';
import insertLoadingAnimation from './helpers/insertLoadingAnimation.js';
import downloadTextfile from './helpers/downloadTextfile.js';
import toggleActiveState from '../utils/toggleActiveState.js';
import { t } from '../utils/i18n.js';
import hapticFeedback from '../utils/hapticFeedback.js';
import selectors from '../selectors.js';
import news from '../utils/news.js';

/**
 * manages UI elements
 */
export default class UIManager {

  constructor(s) {
    this._selectors = s || selectors;
    this.onScroll = this.onScroll.bind(this);
    this._player = new AudioPlayer();
    this._em = new EventManager();
    this._analytics = new Analytics();
    this._header = new CollapsingHeader();
    this._loadUser();
    news();
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
    initDialogInteractions();

    this._player.init();
    this._em.add(this._loginButton, 'click', this._loginRedirect, { passive: true });
    this._em.add(this._userMenuButton, 'click', this._userMenuOpen.bind(this), { passive: true });
    this._em.add(this._filter, 'change', onFilterChange, { passive: true });
    this._em.add(this._filter, 'focus', this._filterFocus.bind(this), { passive: true });
    this._em.add(this._resetButton, 'click', ev => {
      this._filterFocus(ev);
      onReset();
    }, { passive: true });
    this._em.add(this._toTop, 'click', this._toTopHandler.bind(this), { passive: true });
    this._em.add(this._downloadButton, 'click', this._dl, { passive: true });
  }

  /**
   * Closes the user menu
   */
  _userMenuClose() {
    const bd = document.querySelector('.backdrop');
    this._em.add(bd, 'transitionend', _ => {
      bd.remove();
      this._em.removeByNamespace('backdrop-click');
    }, null, 'backdrop-click');
    requestAnimationFrame(_ => {
      this._userMenu.removeAttribute('open');
      bd.removeAttribute('visable');
    });
  }

  /**
   * Toggles the user menu open/close state
   *
   * @private
   * @returns {void}
   */
  _userMenuOpen(ev) {
    const bd = document.createElement('div');
    bd.classList.add('backdrop');
    document.body.appendChild(bd);
    this._em.add(bd, 'click', this._userMenuClose.bind(this), { passive: true }, 'backdrop-click');
    
    const { top } = ev.target.getBoundingClientRect();
    const left = 10;
    const menu = this._userMenu;
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    requestAnimationFrame(_ => {
      bd.setAttribute('visable', true);
      menu.setAttribute('open', true);
    });
  }

  /**
   * Redirects to the login page if the user is not authenticated
   *
   * @returns {void}
   */
  _loginRedirect() {
    if (window.user) return;
    hapticFeedback();
    window.location.href = '/auth';
  }

  /**
   * remove UI listeners
   * 
   * @public
   * @function
   */
  detachListeners() {
    destroyDialogInteractions();
    this._analytics.destroy();
    this._player.destroy();
    this._header.destroy();
    this._em.removeAll();
    console.log('UIManager: listeners removed');
  }

  /**
   * querySelector for the 'to top' button
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _toTop() {
    return document.querySelector(this._selectors.toTop);
  }

  /**
   * querySelector for genre filter input element
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _filter() {
    return document.querySelector(this._selectors.filter);
  }

  /**
   * qs for download button
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _downloadButton() {
    return document.querySelector(this._selectors.downloadButton);
  }

  /**
   * querySelector for 'station count' element
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _stationCount() {
    return document.querySelector(this._selectors.stationCount);
  }

  /**
   * querySelector for 'reset' button
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _resetButton() {
    return document.querySelector(this._selectors.resetButton);
  }

  /**
   * querySelector for 'reset' button
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _loginButton() {
    return document.querySelector(this._selectors.login);
  }

  /**
   * querySelector for user menu
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _userMenu() {
    return document.querySelector(this._selectors.userMenu);
  }

  /**
   * querySelector for user menu button
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _userMenuButton() {
    return document.querySelector(this._selectors.userMenuButton);
  }

  /**
   * querySelector for 'main' element
   * 
   * @private
   * @returns {HTMLElement}
   */
  get _main() {
    return document.querySelector(this._selectors.main);
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
   * loads the user data to UI
   */
  _loadUser() {
    if (!window.user) return;
    const button = this._loginRedirect;
    if (!button) {
      console.error('Login button element is missing.');
      return;
    }
    const user = window.user;
    const img = document.createElement('img');
    img.src = user.picture;
    img.alt = 'user profile picture';
    img.width = '24';
    const avatar = document.createElement('img');
    avatar.src = user.picture;
    avatar.alt = 'user profile picture';
    avatar.width = '70';
    document.querySelector(this._selectors.userAvatar).replaceChildren(avatar);
    button.replaceChildren(img);
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
   * @param {HTMLElement} parent 
   */
  onScroll(scrollTop) {
    this._header.scroll(scrollTop);
    const closeToTop = scrollTop < (window.innerHeight * 0.2);
    closeToTop ? this._toTop.classList.add('hidden') : this._toTop.classList.remove('hidden');
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
    this._stationCount.textContent = t('stations', total, selected);
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
    const wrapper = this._main;
    if (!wrapper) {
      console.error('Main wrapper element is missing.');
      return;
    }
    hapticFeedback();
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
    const loadingEl = document.querySelector(this._selectors.loading);
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
    const selected = document.querySelectorAll(this._selectors.selectedStation);
    if (!selected.length) return;
  
    const isHidden = selected[0].style.display === 'none';
    const displayValue = isHidden ? 'flex' : 'none';
  
    selected.forEach(el => {
      el.style.display = displayValue;
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