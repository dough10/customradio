import downloadTextfile from './downloadTextfile.js';
import insertLoadingAnimation from './5dots.js';
import AudioPlayer from './audio.js';
import loadServiceWorker from './loadServiceWorker.js';
import initDialogInteractions from './dialog.js';
import Toast from '../Toast/Toast.js';
import setSelectedCount from './setSelectedCount.js';
import queryString from './queryString.js';
import LazyLoader from './LazyLoader.js';
import sleep from './sleep.js';
import initAnalytics from './analytics.js';
import populateContainer from './populateContainer.js';

export default class CustomRadioApp {
  // lazyloader instance
  _lzldr = null;
  // last known scroll position
  _lastTop = 0;
  
  constructor() {
    // cache top button for scroll performance
    this._toTop = document.querySelector('.to-top');

    this._player = new AudioPlayer();
    this._filterChanged = this._filterChanged.bind(this);
    this._loadGenres = this._loadGenres.bind(this);
    this._createOption = this._createOption.bind(this);
    this._toggleDisplayOnScroll = this._toggleDisplayOnScroll.bind(this);
    this._resetHandler = this._resetHandler.bind(this);
    this._toTopHandler = this._toTopHandler.bind(this);

    this._downloadHandler = downloadTextfile;
  }

  /**
   * resets the filter input
   */
  _resetHandler() {
    const filter = document.querySelector('#filter');
    filter.value = '';
    this._filterChanged({ target: filter });
  }

  /**
   * scrolls to the top of the page
   */
  _toTopHandler() {
    const wrapper = document.querySelector('.wrapper');
    wrapper.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * loads genres into a datalist element
   */
  async _loadGenres() {
    const res = await fetch(`${window.location.origin}/topGenres`);
    if (res.status !== 200) {
      console.error('failed loading genres');
    }
    const jsonData = await res.json();
    const options = jsonData.map(this._createOption);
    document.querySelector('#genres').replaceChildren(...options);
  }

  /**
   * gets the current genres from the UI
   * 
   * @returns {Array} list of genres
   */
  _currentGenres() {
    const parent = document.querySelector('#genres');
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
   * filter db request by user entered genres
   * 
   * @function
   * 
   * @param {Event} ev 
   * 
   * @returns {void}
   */
  async _filterChanged(ev) {
    ev.target.blur();
    const container = document.querySelector('#stations');
    const stationCount = document.querySelector('#station-count');
    const countParent = stationCount.parentElement;
    
    try {
      // remove lazyloader
      if (this._lzldr) {
        this._lzldr.destroy();
        this._lzldr = null;
      }
      
      // loading animation
      countParent.style.display = 'none';
      insertLoadingAnimation(container);
      
      // localstorage
      let storedElements = JSON.parse(localStorage.getItem('selected'));
      
      // variable sent with a filterChange call to determine if localstorage load is needed
      if (ev.loadLocal) {
        // push station elements from localstorage to dom
        if (storedElements) {
          populateContainer(container, storedElements, this._player, true);
          setSelectedCount(storedElements.length);
        }
        
        // recently searched genres
        await this._loadGenres();
      }
      
      // station list from api
      const res = await fetch(`${window.location.origin}/stations${queryString(ev.target.value)}`);
      if (res.status !== 200) {
        new Toast(`Error fetching stations: ${res.statusText}`);
        return;
      }
      const stations = await res.json();
      
      // get list of selected stations from DOM
      const selectedElements = Array.from(container.querySelectorAll('li[selected]'))
      .sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
      
      // create a list for comparison to prevent duplicate stations in DOM tree
      const selectedUrls = new Set(selectedElements.map(el => el.dataset.url)); 
      
      // remove stations already listed from API response data
      const list = stations.filter(station => !selectedUrls.has(station.url));
      
      // update UI removing all previous elements and replacing with the new list of selected elements
      // (this also removes the loading element)
      const fragment = document.createDocumentFragment();
      fragment.append(...selectedElements);
      container.scrollTop = 0;
      container.replaceChildren(fragment);
  
      // append additonal "unselected" elements, load more elements when scrolled to 80% or > page height
      this._lzldr = new LazyLoader(list, container, this._player, this._toggleDisplayOnScroll);
      
      // update station count and display it
      stationCount.textContent = `${stations.length} results`;
  
      // update recently searched genres
      if (ev.target.value.length && !this._currentGenres().includes(ev.target.value)) {
        await this._loadGenres();
      }
  
      // analytics
      if (typeof _paq !== 'undefined' && ev.target.value.length) {
        _paq.push(['trackEvent', 'Filter', ev.target.value || '']);
      }
    } catch (error) {
      // remove loading animation
      const loadingEl = document.querySelector('.loading');
      if (loadingEl) loadingEl.remove();
      
      // log error
      console.error('Error fetching stations:', error.message);
      new Toast(`Error fetching stations: ${error.message}`);
      
      // analytics
      if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Fetch Error', error || 'Could not get Message']);
    } finally {
      // show count element
      countParent.style.removeProperty('display');
    }
  }

  /**
   * shows a greeting dialog to the user
   * 
   * @returns {void}
   */
  async _greetUser() {
    const hasBeenGreeted = Number(localStorage.getItem('greeted'))
    const greetingElement = document.querySelector('#greeting');

    await sleep(100);

    if (hasBeenGreeted) {
      greetingElement.remove();
      return;
    }
    greetingElement.showModal();
    greetingElement.addEventListener('transitionend', e => {
      if (greetingElement.hasAttribute('open')) return;
      greetingElement.remove();
    });
  }

  /**
   * attaches listeners to the form elements
   */
  _attachFormListeners() {
    const dlButton = document.querySelector('#download');
    dlButton.addEventListener('click', this._downloadHandler);
    
    const filter = document.querySelector('#filter');
    filter.addEventListener('change', this._filterChanged);
    this._filterChanged({ target: filter, loadLocal: true });
    
    document.querySelector('.reset').addEventListener('click', this._resetHandler);
  }

  /**
   * destroys the app
   *  1. removes listeners
   *  2. destroys lazyloader
   */
  destroy() {
    const dlButton = document.querySelector('#download');
    dlButton.removeEventListener('click', this._downloadHandler);
  
    const filter = document.querySelector('#filter');
    filter.removeEventListener('change', this._filterChanged);
  
    const resetButton = document.querySelector('.reset');
    resetButton.removeEventListener('click', this._resetHandler);
  
    const toTop = document.querySelector('.to-top');
    toTop.removeEventListener('click', this._toTopHandler);
  
    if (this._lzldr) {
      this._lzldr.destroy();
      this._lzldr = null;
    }
  }

  /**
   * initializes the app
   */
  async init() {
    loadServiceWorker();

    this._attachFormListeners();
    
    const toTop = document.querySelector('.to-top');
    toTop.addEventListener('click', this._toTopHandler);
    
    this._player.init();

    initDialogInteractions();

    initAnalytics();

    this._greetUser();
  }
}