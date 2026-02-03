import AudioPlayer from './AudioPlayer/AudioPlayer.js';
import CollapsingHeader from './CollapsingHeader/CollapsingHeader.js';
import EventManager from '../EventManager/EventManager.js';

import {initDialogInteractions, destroyDialogInteractions} from './dialogs/dialog.js';
import insertLoadingAnimation from './helpers/insertLoadingAnimation.js';
import downloadTextfile from './helpers/downloadTextfile.js';
import sleep from '../utils/sleep.js';
import toggleActiveState from '../utils/toggleActiveState.js';
import { t } from '../utils/i18n.js';
import hapticFeedback from '../utils/hapticFeedback.js';
import selectors from '../selectors.js';
import news from '../utils/news.js';
import txtDownloadUrl from '../utils/txtDownloadUrl.js';


const NAMESPACE = {
  backdropClick: 'backdrop-click'
};

/**
 * manages UI elements
 */
export default class UIManager {

  constructor(s) {
    this.$toTop = document.querySelector(selectors.toTop);
    this.$filter = document.querySelector(selectors.filter);
    this.$downloadButton = document.querySelector(selectors.downloadButton);
    this.$stationCount = document.querySelector(selectors.stationCount);
    this.$resetButton = document.querySelector(selectors.resetButton);
    this.$loginButton = document.querySelector(selectors.login);
    this.$logoutButton = document.querySelector(selectors.logout);
    this.$userMenu = document.querySelector(selectors.userMenu);
    this.$userMenuButton = document.querySelector(selectors.userMenuButton);
    this.$main = document.querySelector(selectors.main);
    this.$sharelink = document.querySelector(selectors.sharelink);
    this.$toggleSelected = document.querySelector(selectors.toggleSelected);

    const required = [
      this.$toTop,
      this.$filter,
      this.$downloadButton,
      this.$stationCount,
      this.$resetButton,
      this.$loginButton,
      this.$logoutButton,
      this.$userMenu,
      this.$userMenuButton,
      this.$main,
      this.$sharelink,
      this.$toggleSelected
    ]

    if (required.some(el => !el)) {
      throw new Error("Initialization failed — missing DOM elements.");
    }

    this._selectors = s || selectors;
    this._lastTop = 0;
    this._player = new AudioPlayer();
    this._em = new EventManager();
    this._header = new CollapsingHeader();
    this._loadUser(window.user);

    this._selectedHidden = false;

    // news();
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
    this._em.add(this.$toggleSelected, 'click', _ => this.toggleSelectedVisibility(), { passive: true });
    this._em.add(this.$loginButton, 'click', _ => this._loginRedirect(), { passive: true });
    this._em.add(this.$logoutButton, 'click', _ => this._logoutRedirect(), { passive: true });
    this._em.add(this.$userMenuButton, 'click', ev => this._userMenuOpen(ev), { passive: true });
    this._em.add(this.$filter, 'change', onFilterChange, { passive: true });
    this._em.add(this.$filter, 'focus', ev => this._filterFocus(ev), { passive: true });
    this._em.add(this.$resetButton, 'click', ev => {
      this._filterFocus(ev);
      onReset();
    }, { passive: true });
    this._em.add(this.$toTop, 'click', _ => this._toTopHandler(), { passive: true });
    this._em.add(this.$downloadButton, 'click', _ => this._dl(), { passive: true });
    document.querySelectorAll('.menu-button').forEach(btn => {
      this._em.add(btn, 'click', _ => this._userMenuClose(), { passive: true });
    });
  }

  /**
   * remove UI listeners
   * 
   * @public
   * @function
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
   * Closes the user menu
   */
  _userMenuClose() {
    const bd = document.querySelector('.backdrop');
    if (!bd) return;
    this._em.add(bd, 'transitionend', _ => {
      this._em.removeByNamespace(NAMESPACE.backdropClick);
      bd.remove();
    }, null, NAMESPACE.backdropClick);
    requestAnimationFrame(_ => {
      this.$userMenu.removeAttribute('open');
      bd.removeAttribute('visible');
    });
  }

  /**
   * Toggles the user menu open/close state
   *
   * @private
   * @returns {void}
   */
  async _userMenuOpen(ev) {
    const backdrop = document.createElement('div');
    backdrop.classList.add('backdrop');
    this._em.add(backdrop, 'click', _ => this._userMenuClose(), { passive: true }, NAMESPACE.backdropClick);
    document.body.appendChild(backdrop);
    
    const { top } = ev.target.getBoundingClientRect();
    const left = 8;
    this.$userMenu.style.top = `${top + 8}px`;
    this.$userMenu.style.left = `${left}px`;
    await sleep(20);
    requestAnimationFrame(_ => {
      backdrop.setAttribute('visible', true);
      this.$userMenu.setAttribute('open', true);
    });
  }

  /**
   * Redirects to the login page if the user is not authenticated
   *
   * @returns {void}
   */
  _loginRedirect() {
    if (window.user) return;    
    try {
      window.location.href = new URL(
        '/auth',
        window.location.origin
      ).toString();
    } catch (e) {
      console.error('UIManager: login redirect failed', e);
      return;
    }
  }

  /**
   * Redirects to the logout page if the user is authenticated
   *
   * @returns {void}
   */
  _logoutRedirect() {
    if (!window.user) return;
    try {
      window.location.href = new URL(
        '/auth/logout',
        window.location.origin
      ).toString();
    } catch (e) {
      console.error('UIManager: logout redirect failed', e);
      return;
    }
  }

  /**
   * creates a user image element
   * 
   * @private
   * @function
   * 
   * @param {Object} user
   * @param {Number} size
   * @returns {HTMLElement}
   */
  _userImage({picture}, size) {
    const img = document.createElement('img');
    img.src = picture;
    img.alt = 'user profile picture';
    img.width = size;
    return img;
  }

  /**
   * loads the user data to UI
   */
  _loadUser(user) {
    this.$logoutButton.style.display = 'none';
    this.$sharelink.style.display = 'none';
    
    if (!user) return;

    if (!this.$userMenuButton) {
      console.error('Login button element is missing.');
      return;
    }

    const small = this._userImage(user, 24);
    const big = this._userImage(user, 70);

    document.querySelector(this._selectors.userAvatar).replaceChildren(big);
    this.$userMenuButton.replaceChildren(small);

    document.querySelector(this._selectors.firstname).textContent = user.firstName;
    document.querySelector(this._selectors.lastname).textContent = user.lastName;

    const input = document.querySelector(this._selectors.shareInput);
    if (!input) {
      console.error('Share input element is missing.');
      return;
    }
    input.value = txtDownloadUrl();

    this.$loginButton.style.display = 'none';
    this.$logoutButton.style.display = 'flex';
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
    this.$sharelink.style.display = 'flex';
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
   * @param {HTMLElement} parent 
   */
  onScroll(scrollTop) {
    this._header.scroll(scrollTop);
    const closeToTop = scrollTop < (window.innerHeight * 0.2);
    closeToTop ? this.$toTop.classList.add('hidden') : this.$toTop.classList.remove('hidden');
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
    toggleActiveState(this.$downloadButton, selected);
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
   */
  toggleSelectedVisibility() {
    const selected = document.querySelectorAll(this._selectors.selectedStation);
    if (!selected.length) return;
    this._selectedHidden = !this._selectedHidden;
    this._selectedHidden ? this.$main.classList.add('hide-selected') : this.$main.classList.remove('hide-selected');
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