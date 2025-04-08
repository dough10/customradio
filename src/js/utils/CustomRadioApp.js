import downloadTextfile from './downloadTextfile.js';
import insertLoadingAnimation from './5dots.js';
import AudioPlayer from './AudioPlayer.js';
import loadServiceWorker from './loadServiceWorker.js';
import {initDialogInteractions, destroyDialogInteractions} from './dialog.js';
import Toast from '../Toast/Toast.js';
import setSelectedCount from './setSelectedCount.js';
import queryString from './queryString.js';
import LazyLoader from './LazyLoader.js';
import sleep from './sleep.js';
import initAnalytics from './analytics.js';
import retryFetch from './retryFetch.js';
import debounce from './debounce.js';

export default class CustomRadioApp {
  // lazyloader instance
  _lzldr = null;
  // last known scroll position
  _lastTop = 0;

  // HTMLElement selectors
  _selectors = {
    filter: '#filter',
    toTop: '.to-top',
    genres: '#genres',
    stationCount: '#station-count',
    stationsContainer: '#stations',
    downloadButton: '#download',
    resetButton: '.reset',
    wrapper: '.wrapper',
    greetingElement: '#greeting'
  };
  
  constructor() {
    // cache top button for scroll performance
    this._toTop = document.querySelector(this._selectors.toTop);

    this._player = new AudioPlayer();
    this._filterChanged = this._filterChanged.bind(this);
    this._loadGenres = this._loadGenres.bind(this);
    this._createOption = this._createOption.bind(this);
    this._toggleDisplayOnScroll = this._toggleDisplayOnScroll.bind(this);
    this._resetHandler = this._resetHandler.bind(this);
    this._toTopHandler = this._toTopHandler.bind(this);
    this._bouncedFilter = debounce(this._filterChanged, 150);
    this._downloadHandler = downloadTextfile;
  }

  /**
   * resets the filter input
   */
  _resetHandler() {
    const filter = document.querySelector(this._selectors.filter);
    if (!filter) {
      console.error('Filter element not found.');
      return;
    }
    filter.value = '';
    this._filterChanged({ target: filter });
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
   * loads genres into a datalist element
   */
  async _loadGenres() {
    const res = await retryFetch(`${window.location.origin}/topGenres`);
    if (res.status !== 200) {
      console.error('failed loading genres');
    }
    const jsonData = await res.json();
    const options = jsonData.map(this._createOption);
    document.querySelector(this._selectors.genres).replaceChildren(...options);
  }

  /**
   * gets the current genres from the UI
   * 
   * @returns {Array} list of genres
   */
  _currentGenres() {
    const parent = document.querySelector(this._selectors.genres);
    const options = Array.from(parent.querySelectorAll('option'));
    return options.map(element => element.value);
  }

  /**
   * creates a datalist option element
   * 
   * @param {String} str 
   * 
   * @returns {HTMLElement}
   */
  _createOption(str) {
    const option = document.createElement('option');
    option.value = str;
    return option;
  }

  /**
   * toggles the display of the "to top" button on scroll
   * 
   * @param {HTMLElement} parent 
   */
  _toggleDisplayOnScroll(parent) {
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
   * gets selected stations from localstorage or from the DOM
   * 
   * @param {Boolean} loadFromLocal load stations from localstorage
   * @param {HTMLElement} container html element to search for "selected" stations
   */
  _getSelectedStations(loadFromLocal, container) {
    if (loadFromLocal) {
      const storedElements = JSON.parse(localStorage.getItem('selected')) || [];
      return storedElements.map(obj => ({ ...obj, selected: true }));
    }
    return Array.from(container.querySelectorAll('li[selected]'))
    .sort((a, b) => a.dataset.name.localeCompare(b.dataset.name))
    .map(el => ({
      id: el.id,
      ...el.dataset,
      selected: true
    }));
  }

  /**
   * filters the stations by removing the selected stations
   * 
   * @param {Array} selected list of selected stations
   * @param {Array} stations bulk list of stations to filter
   * 
   * @returns {Array} filtered stations
   */
  _removeSelectedFromList(selected, stations) {
    const selectedUrls = new Set(selected.map(({ url }) => url));
    return stations.filter(({ url }) => !selectedUrls.has(url));
  }

  /**
   * gets stations from the server
   * and updates the UI with counts
   * 
   * @param {String} genreFilter genres to filter by
   * @param {Boolean} loadFromLocal if load from localstorage
   * @param {HTMLElement} container html element containing "selected" stations
   * 
   * @returns {Promise(Array[objects])}
   */
  async _getStations(genreFilter, loadFromLocal, container) {
    // stations that are added to the download list
    const selected = this._getSelectedStations(loadFromLocal, container);

    // fetch bulk station list
    const res = await retryFetch(`${window.location.origin}/stations${queryString(genreFilter)}`);
    if (res.status !== 200) {
      new Toast(`Error fetching stations: ${res.statusText}`);
      return;
    }
    
    // removes any duplicate station already in selected list
    const list = this._removeSelectedFromList(selected, await res.json());

    // update UI with stations counts
    setSelectedCount(selected.length);
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.textContent = `${list.length} results`;

    return [...selected, ...list];
  }

  /**
   * creates a loading animation
   */
  _loadingStart(container) {
    insertLoadingAnimation(container);
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.parentElement.style.display = 'none';
  }

  /**
   * removes the loading animation
   */
  _loadingEnd() {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.parentElement.style.removeProperty('display');
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
    this._loadingStart(container);

    try {
      // remove lazyloader
      if (this._lzldr) {
        this._lzldr.destroy();
        this._lzldr = null;
      }
      
      const stations = await this._getStations(userInput, ev.loadLocal, container);
  
      // push items to the UI and load more elements when scrolled to 80% or > of the pages height
      this._lzldr = new LazyLoader(stations, container, this._player, this._toggleDisplayOnScroll);
  
      // if a genre was searched and not in the list, load the genres
      const isNewGenreSearch = userInput.length && !this._currentGenres().includes(userInput);
      if (isNewGenreSearch || ev.loadLocal) {
        this._loadGenres();
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
      this._loadingEnd();      
    }
  }

  /**
   * shows a greeting dialog to the user
   * 
   * @returns {void}
   */
  async _greetUser() {
    const hasBeenGreeted = Number(localStorage.getItem('greeted'))
    const greetingElement = document.querySelector(this._selectors.greetingElement);

    await sleep(100);

    if (hasBeenGreeted) {
      greetingElement.remove();
      return;
    }
    greetingElement.showModal();
    // remove after closing
    greetingElement.addEventListener('transitionend', () => {
      if (!greetingElement.hasAttribute('open')) greetingElement.remove();
    });
  }

  /**
   * attaches listeners
   */
  _attachListeners() {
    const dlButton = document.querySelector(this._selectors.downloadButton);
    dlButton.addEventListener('click', this._downloadHandler);
    
    const filter = document.querySelector(this._selectors.filter);
    filter.addEventListener('change', this._bouncedFilter);
    
    const resetButton = document.querySelector(this._selectors.resetButton);
    resetButton.addEventListener('click', this._resetHandler);

    const toTop = document.querySelector(this._selectors.toTop);
    toTop.addEventListener('click', this._toTopHandler);
  }

  /**
   * destroys the app
   *  1. removes listeners
   *  2. destroys lazyloader
   */
  destroy() {
    const dlButton = document.querySelector(this._selectors.downloadButton);
    dlButton.removeEventListener('click', this._downloadHandler);
  
    const filter = document.querySelector(this._selectors.filter);
    filter.removeEventListener('change', this._bouncedFilter);
  
    const resetButton = document.querySelector(this._selectors.resetButton);
    resetButton.removeEventListener('click', this._resetHandler);
  
    const toTop = document.querySelector(this._selectors.toTop);
    toTop.removeEventListener('click', this._toTopHandler);
  
    this._player.destroy();

    destroyDialogInteractions();

    if (this._lzldr) {
      this._lzldr.destroy();
      this._lzldr = null;
    }
  }

  /**
   * initializes the app
   */
  async init() {
    initAnalytics();
    loadServiceWorker();
    this._attachListeners();
    initDialogInteractions();
    this._player.init();
    this._filterChanged({ 
      target: document.querySelector(this._selectors.filter), 
      loadLocal: true 
    });
    this._greetUser();
  }
}