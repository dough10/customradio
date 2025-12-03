import UIManager from './UIManager/UIManager.js';
import StationManager from './StationManager/StationManager.js';
import Toast from './Toast/Toast.js';
import LazyLoader from './LazyLoader/LazyLoader.js';

import loadServiceWorker from './utils/loadServiceWorker.js';
import { setLanguage, t } from './utils/i18n.js';
import normalizeMemo from './utils/normalizeMemo.js';
import hapticFeedback from './utils/hapticFeedback.js';
import selectors from './selectors.js';

/**
 * customradio.dough10.me
 */
export default class CustomRadioApp {
  constructor(uiManager, stationManager, haptic, swLoader) {
    this._uiManager = uiManager || new UIManager();
    this._stationManager = stationManager || new StationManager();
    this._hapticFeedback = haptic || hapticFeedback;
    this._loadServiceWorker = swLoader || loadServiceWorker;

    const lang = navigator.language.split('-')[0];
    setLanguage(lang);
    console.log(`Language set to: ${lang}`);
  }
  
  /**
   * initializes the app
  */
  init() {
    this._loadServiceWorker();

    this._uiManager.attachListeners({
      onFilterChange: this._filterChanged.bind(this),
      onReset: this._resetFilter.bind(this)
    });
    
    // initial load of stations
    this._filterChanged({ 
      target: document.querySelector(selectors.filter), 
      loadLocal: true 
    });
  }

  /**
   * destroys the app
   */
  destroy() {
    this._uiManager.detachListeners();
    
    if (this._lzldr) {
      this._lzldr.destroy();
      this._lzldr = null;
    }
  }

  /**
   * resets the filter input
   */
  _resetFilter() {
    const filter = document.querySelector(selectors.filter);
    if (!filter) {
      console.error('Filter element not found.');
      return;
    }
    if (!filter.value) return; 
    this._hapticFeedback();
    filter.value = '';
    this._filterChanged({ target: filter });
  }

  /**
   * returns a list of stations based on user input
   * 
   * @param {String} userInput
   * @param {Boolean} loadLocal
   * @param {HTMLElement} container
   * 
   * @returns {Promise<{ stations: Array, selected: Number, list: Number }>}
   */
  async _createStationList(userInput, loadLocal, container) {
    const selected = await this._stationManager.getSelectedStations(loadLocal, container);
    const stations = await this._stationManager.fetchStations(userInput);
    const list = this._stationManager.filterStations(selected, stations);

    if (loadLocal) this._uiManager.loadShareButton(selected.length);

    return {
      stations: [...selected, ...list],
      selected: selected.length,
      list: list.length
    }
  }

  /**
   * 
   * @param {Object} stationList
   * @param {Array} stationList.stations 
   * @param {Number} stationList.selected 
   * @param {Number} stationList.list 
   * @param {HTMLElement} container
   */
  _updateUIStationsList({stations, selected, list}, container) {
    this._uiManager.setCounts(selected, list);
    container.replaceChildren(document.querySelector(selectors.loading));
    this._lzldr ? this._lzldr.reset(stations) : this._lzldr = new LazyLoader(
      stations,                    // list of audio streams
      container,                   // page "main" element
      this._uiManager.audioPlayer, // audio player instance
      this._uiManager.onScroll     // scroll handler
    );
  }

  /**
   * 
   * @param {String} userInput 
   * @param {Boolean} loadLocal 
   */
  async _updateGenresDatalist(userInput, loadLocal) {
    const currentGenres = this._uiManager.currentGenres();
    const isNewGenreSearch = userInput.length && !currentGenres.includes(userInput);
    if (isNewGenreSearch || loadLocal) {
      const genreList = await this._stationManager.getGenres();
      this._uiManager.loadGenres(genreList);
    }
  }

  /**
   * reports an event to the matomo analytics service
   * 
   * @param {String} category 
   * @param {String} action 
   * @param {String} name 
   */
  _analyticsTrackEvent(category, action, name) {
    if (typeof _paq !== 'undefined') {
      _paq.push(['trackEvent', category, action, name]);
    }
  }

  /**
   * Handles errors when fetching stations
   * 
   * @param {Object} error 
   * @param {String} error.message error message
   */
  _filterFailed(error) {
    if (this._lzldr) {
      this._lzldr.destroy();
      this._lzldr = null;
    }
    console.error(`Error fetching stations: ${error.message}`);
    new Toast(t('stationsError', error.message));
    this._analyticsTrackEvent('Fetch Error', error.message, '');
  }

  /**
   * gets user input from the filter input element
   * 
   * @param {Event} ev input event
   * 
   * @returns {String} userInput
   */
  _getuserInput(ev) {
    ev.target.blur();
    const userInput = normalizeMemo(ev.target.value.trim() || '');
    if (userInput.length) console.log(`Filter changed: ${userInput}`);
    return userInput;
  }

  /**
   * filter db request by user entered genres
   * 
   * @function
   * 
   * @param {Event} ev
   * @param {HTMLElement} ev.target filter input element
   * @param {String} ev.target.value user input
   * @param {Boolean} ev.loadLocal load from localstorage
   * 
   * @returns {void}
   */
  async _filterChanged(ev) {
    const userInput = this._getuserInput(ev);
    const container = document.querySelector(selectors.stationsContainer);
    this._uiManager.loadingStart(container);
    try {
      const stationList = await this._createStationList(userInput, ev.loadLocal, container);
      this._updateUIStationsList(stationList, container);
      await this._updateGenresDatalist(userInput, ev.loadLocal);
      if (userInput.length) this._analyticsTrackEvent('Filter', 'Change', userInput);
    } catch (error) {
      this._filterFailed(error);
    } finally {
      this._uiManager.loadingEnd();
    }
  }
}