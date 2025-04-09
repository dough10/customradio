import queryString from './queryString.js';
import retryFetch from './retryFetch.js';

/**
 * manages connection with API, localstorage, selected managment
 */
export default class StationManager {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * fetches station list from API
   * 
   * @param {String} genreFilter 
   * 
   * @returns {Object}
   */
  async fetchStations(genreFilter) {
    const res = await retryFetch(`${this.apiBaseUrl}/stations${queryString(genreFilter)}`);
    if (res.status !== 200) {
      throw new Error(`Error fetching stations: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * removes stations in the selected array from the stations array and returns the remainder
   * 
   * @param {Array} selected stations selected in the UI
   * @param {Array} stations bulk station list
   * 
   * @returns {Array}
   */
  filterStations(selected, stations) {
    const selectedUrls = new Set(selected.map(({ url }) => url));
    return stations.filter(({ url }) => !selectedUrls.has(url));
  }

  /**
   * get list of most searched genres
   * 
   * @returns {Object}
   */
  async getGenres() {
    const res = await retryFetch(`${this.apiBaseUrl}/topGenres`);
    if (res.status !== 200) {
      throw new Error(`Error fetching genres: ${res.statusText}`);
    }
    return await res.json();
  }

  /**
   * loads list of stations from localstorage if "loadFromLocal" is true
   * otherwise grabs the selected station from UI
   * 
   * @param {Boolean} loadFromLocal 
   * @param {HTMLElement} container 
   * 
   * @returns {Array}
   */
  getSelectedStations(loadFromLocal, container) {
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
}