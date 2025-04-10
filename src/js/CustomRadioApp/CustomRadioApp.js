import loadServiceWorker from './utils/loadServiceWorker.js';
import AudioPlayer from './AudioPlayer/AudioPlayer.js';
import Toast from './Toast/Toast.js';
import LazyLoader from './LazyLoader/LazyLoader.js';
import UIManager from './UIManager/UIManager.js';
import StationManager from './StationManager/StationManager.js';

/**
 * customradio.dough10.me
 */
export default class CustomRadioApp {
  // HTMLElement selectors
  _selectors = {
    filter: '#filter',
    toTop: '.to-top',
    genres: '#genres',
    stationCount: '#station-count',
    stationsContainer: '#stations',
    downloadButton: '#download',
    resetButton: '.reset',
    wrapper: '.wrapper'
  };
  
  constructor() {
    this._uiManager = new UIManager(this._selectors);
    this._stationManager = new StationManager(window.location.origin);
    this._player = new AudioPlayer();
  }

  /**
   * initializes the app
   */
  init() {
    loadServiceWorker();

    this._player.init();

    this._uiManager.attachListeners({
      onFilterChange: this._filterChanged.bind(this),
      onReset: this._resetFilter.bind(this)
    });
    
    this._filterChanged({ 
      target: document.querySelector(this._selectors.filter), 
      loadLocal: true 
    });
  }

  /**
   * destroys the app
   */
  destroy() {
    this._player.destroy();
    
    this._uiManager.detachListeners({
      onFilterChange: this._filterChanged.bind(this),
      onReset: this._resetFilter.bind(this)
    });
    
    if (this._lzldr) {
      this._lzldr.destroy();
    }
  }

  /**
   * resets the filter input
   */
  _resetFilter() {
    const filter = document.querySelector(this._selectors.filter);
    if (!filter) {
      console.error('Filter element not found.');
      return;
    }
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

    const userInput = ev.target.value.trim();
    if (userInput && !userInput.match(/^[a-zA-Z0-9\s@\-_.",'&]+$/)) {
      new Toast('Invalid input. Please enter valid genres.');
      return;
    }

    const container = document.querySelector(this._selectors.stationsContainer);
    
    // loading animation
    this._uiManager.loadingStart(container);

    try {
      // remove lazyloader
      if (this._lzldr) {
        this._lzldr.destroy();
        this._lzldr = null;
      }
      
      // get stations added to the download list
      const selected = this._stationManager.getSelectedStations(ev.loadLocal, container);

      const stations = await this._stationManager.fetchStations(userInput);

      // removes any duplicate station already in selected list
      const list = this._stationManager.filterStations(selected, stations);

      // update UI with stations counts
      this._uiManager.setCounts(selected.length, list.length);
  
      // remove children leaving only the loading element created with this._uiManager.loadingStart ^
      container.replaceChildren(document.querySelector('.loading'));

      // push items to the UI and load more elements when scrolled to 80% or > of the pages height
      this._lzldr = new LazyLoader([...selected, ...list], container, this._player, this._uiManager.toggleDisplayOnScroll);
  
      // if a genre was searched and not in the list, load the genres
      const isNewGenreSearch = userInput.length && !this._uiManager.currentGenres().includes(userInput);
      if (isNewGenreSearch || ev.loadLocal) {
        const genreList = await this._stationManager.getGenres();
        this._uiManager.loadGenres(genreList);
      }
  
      // analytics
      if (typeof _paq !== 'undefined' && userInput.length) {
        _paq.push(['trackEvent', 'Filter', userInput || '']);
      }
    } catch (error) {
      // log error
      const errorMessage = `Error fetching stations: ${error.message}`;
      console.error(errorMessage);
      new Toast(errorMessage);
      this._lzldr = null;
      
      // analytics
      if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Fetch Error', error || 'Could not get Message']);
    } finally {
      // remove loading animation
      this._uiManager.loadingEnd();      
    }
  }
}