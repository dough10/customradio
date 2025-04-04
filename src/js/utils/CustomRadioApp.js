import downloadTextfile from './downloadTextfile.js';
import insertLoadingAnimation from './5dots.js';
import AudioPlayer from './audio.js';
import loadServiceWorker from './loadServiceWorker.js';
import initDialogInteractions from './dialog.js';
import Toast from '../Toast/Toast.js';
import { createStationElement } from './createStationElement.js';
import setSelectedCount from './setSelectedCount.js';
import queryString from './queryString.js';
import LazyLoader from './LazyLoader.js';
import sleep from './sleep.js';
import initAnalytics from './analytics.js';

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
    this._populateContainerWithSelected = this._populateContainerWithSelected.bind(this);
  }

  /**
   * loads genres into a datalist element
   */
  async _loadGenres() {
    const res = await fetch(`${window.location.origin}/topGenres`);
    if (res.status !== 200) {
      console.error('failed loading genres');
    }
    const jsonData = await res.json()
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
   * creates a datalist element
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
   * populates a container with "selected" station elements
   * also updates the "selected" count UI
   * 
   * @param {Array} stationList
   * @param {HTMLElement} container 
   */
  _populateContainerWithSelected(stationList, container) {
    const localFragment = document.createDocumentFragment();
    stationList.forEach(element => {
      const stationElement = createStationElement(element, this._player);
      stationElement.toggleAttribute('selected');
      localFragment.append(stationElement);
    });
    setSelectedCount(stationList.length);
    container.append(localFragment);
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
          this._populateContainerWithSelected(storedElements, container);
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
      countParent.style.removeProperty('display');
  
      // update recently searched genres
      if (ev.target.value.length && !this._currentGenres().includes(ev.target.value)) {
        await this._loadGenres();
      }
  
      // analytics
      if (typeof _paq !== 'undefined' && ev.target.value.length) _paq.push(['trackEvent', 'Filter', ev.target.value || '']);
    } catch (error) {
      const loadingEl = document.querySelector('.loading');
      if (loadingEl) loadingEl.remove();
      countParent.style.removeProperty('display');
      if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Fetch Error', error || 'Could not get Message']);
      console.error('Error fetching stations:', error.message);
      new Toast(`Error fetching stations: ${error.message}`);
    }
  }

  /**
   * initializes the app
   */
  async init() {
    const dlButton = document.querySelector('#download');
    dlButton.addEventListener('click', _ => downloadTextfile());
    
    const filter = document.querySelector('#filter');
    filter.addEventListener('change', this._filterChanged);
    this._filterChanged({ target: filter, loadLocal: true });
    
    document.querySelector('.reset').addEventListener('click', _ => {
      if (filter.value === '') return;
      filter.value = '';
      this._filterChanged({ target: filter});
    });
    
    const wrapper = document.querySelector('.wrapper');
    const toTop = document.querySelector('.to-top');
    
    toTop.addEventListener('click', _ => wrapper.scrollTo({
      top: 0,
      behavior: 'smooth'
    }));
    
    this._player.init();

    loadServiceWorker();

    initDialogInteractions();

    let greeted = Number(localStorage.getItem('greeted'))

    await sleep(100);
    const greeting = document.querySelector('#greeting');
    if (greeted) {
      greeting.remove();
    } else {
      greeting.showModal();
    }
    greeting.addEventListener('transitionend', e => {
      if (greeting.hasAttribute('open')) return;
      greeting.remove();
    });

    initAnalytics();
  }
}