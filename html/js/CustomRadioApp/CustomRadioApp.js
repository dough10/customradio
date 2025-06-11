import UIManager from './UIManager/UIManager.js';
import StationManager from './StationManager/StationManager.js';
import Toast from './Toast/Toast.js';
import LazyLoader from './LazyLoader/LazyLoader.js';

import loadServiceWorker from './utils/loadServiceWorker.js';
import { setLanguage, t } from './utils/i18n.js';
import normalizeMemo from './utils/normalizeMemo.js';
import hapticFeedback from './utils/hapticFeedback.js';
import selectors from './selectors.js';
import news from './utils/news.js';


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

    news();

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
    // get stations added to the download list from localstorage or already in container
    const selected = this._stationManager.getSelectedStations(loadLocal, container);

    // get stations from db based on user input
    const stations = await this._stationManager.fetchStations(userInput);

    // removes any duplicate station already in selected list
    const list = this._stationManager.filterStations(selected, stations);

    // combine selected and list to create the final stations array
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
    // update stations count
    this._uiManager.setCounts(selected, list);

    // remove children leaving only the loading element created with this._uiManager.loadingStart
    // finally block in _finterChanged method will remove the loading element
    container.replaceChildren(document.querySelector(selectors.loading));

    // push items to the UI and load more elements when scrolling close to bottom of page
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
  _updateGenresDatalist(userInput, loadLocal) {
    // if a genre was searched and not in the current datalist, load the genres again
    const currentGenres = this._uiManager.currentGenres();
    const isNewGenreSearch = userInput.length && !currentGenres.includes(userInput);
    if (isNewGenreSearch || loadLocal) {
      this._stationManager.getGenres().then(genreList => {
        this._uiManager.loadGenres(genreList);
      });
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

    // english error message
    console.error(`Error fetching stations: ${error.message}`);
    // user language translated toast message
    new Toast(t('stationsError', error.message));
    
    // analytics
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
    // drop / remove focus of input element
    ev.target.blur();

    // empty userInput means "show all"
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
    
    // start loading animation
    this._uiManager.loadingStart(container);

    try {
      // create a list of stations based on the users input
      const stationList = await this._createStationList(userInput, ev.loadLocal, container);

      // update the UI with the new stations list
      this._updateUIStationsList(stationList, container);
  
      // update the genres datalist if the user input is a genre or if loadLocal is true
      this._updateGenresDatalist(userInput, ev.loadLocal);
  
      // filter analytics
      if (userInput.length) this._analyticsTrackEvent('Filter', 'Change', userInput);
    } catch (error) {
      // failure
      this._filterFailed(error);
    } finally {
      // remove loading animation
      this._uiManager.loadingEnd();      
    }
  }
}