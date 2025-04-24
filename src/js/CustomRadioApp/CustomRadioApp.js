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
  constructor() {
    const lang = navigator.language.split('-')[0];
    setLanguage(lang);
  }
  
  /**
   * initializes the app
  */
  init() {
    this._uiManager = new UIManager();
    this._stationManager = new StationManager();

    loadServiceWorker();

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
    hapticFeedback();
    filter.value = '';
    this._filterChanged({ target: filter });
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
    ev.target.blur();

    // Continue with fetch — empty userInput means "show all"
    const userInput = normalizeMemo(ev?.target?.value?.trim?.() || '');

    const container = document.querySelector(selectors.stationsContainer);
    
    // loading animation
    this._uiManager.loadingStart(container);

    try {      
      // get stations added to the download list from localstorage or already in container
      const selected = this._stationManager.getSelectedStations(ev.loadLocal, container);

      const stations = await this._stationManager.fetchStations(userInput);

      // removes any duplicate station already in selected list
      const list = this._stationManager.filterStations(selected, stations);

      // update UI with stations counts
      this._uiManager.setCounts(selected.length, list.length);
  
      // remove children leaving only the loading element created with this._uiManager.loadingStart ^
      // finally block removes the loading element
      container.replaceChildren(document.querySelector(selectors.loading));

      // push items to the UI and load more elements when scrolling close to bottom of page
      this._lzldr ? this._lzldr.reset([...selected, ...list]) : this._lzldr = new LazyLoader(
        [...selected, ...list],      // list of audio streams
        container,                   // page "main" element
        this._uiManager.audioPlayer, // audio player instance
        this._uiManager.onScroll     // scroll handler
      );
  
      // if a genre was searched and not in the current datalist, load the genres again
      const currentGenres = this._uiManager.currentGenres();
      const isNewGenreSearch = userInput.length && !currentGenres.includes(userInput);
      if (isNewGenreSearch || ev.loadLocal) {
        const genreList = await this._stationManager.getGenres();
        this._uiManager.loadGenres(genreList);
      }
  
      // analytics
      if (typeof _paq !== 'undefined' && userInput.length) {
        _paq.push(['trackEvent', 'Filter', userInput || '']);
      }
    } catch (error) {
      if (this._lzldr) {
        this._lzldr.destroy();
        this._lzldr = null;
      }

      // english error message
      console.error(`Error fetching stations: ${error.message}`);
      // user language translated toast message
      new Toast(t('stationsError', error.message));
      
      // analytics
      if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Fetch Error', error || 'Could not get Message']);
    } finally {
      // remove loading animation
      this._uiManager.loadingEnd();      
    }
  }
}