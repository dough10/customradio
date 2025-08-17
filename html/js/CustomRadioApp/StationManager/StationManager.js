/**
 * retry 
 * 
 * @param {String} url 
 * @param {Object} options 
 * @param {Number} retries 
 * 
 * @returns {Object}
 */
async function retryFetch(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
}

/**
 * manages connection with API, localstorage, selected managment
 * 
 * @class
 * 
 * @param apiBaseUrl application base url
 */
export default class StationManager {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl || window.location.origin;
  }

  /**
   * generates a URL with the given path and query parameters
   * 
   * @param {String} path 
   * @param {Object} query 
   * 
   * @returns {String}
   */
  #url(path, query) {
    const u = new URL(path, this.apiBaseUrl);
    if (query) {
      Object.keys(query).forEach(key => {
        u.searchParams.append(key, query[key]);
      });
    }
    return u.toString();
  }

  /**
   * fetches station list from API
   * 
   * @param {String} genreFilter 
   * 
   * @returns {Object}
   */
  async fetchStations(genreFilter) {
    const query = genreFilter ? { genres: genreFilter } : null;
    const url = this.#url('/stations', query);
    const res = await retryFetch(url);
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
   * @returns {String[]}
   */
  async getGenres() {
    const url = this.#url('/topGenres');
    const res = await retryFetch(url);
    if (res.status !== 200) {
      throw new Error(`Error fetching genres: ${res.statusText}`);
    }
    return await res.json();
  }

  /**
   * adds selected: true to object
   * 
   * @param {Object} obj 
   * 
   * @returns {Object}
   */
  #mapSelected(elements) {
    return elements.map(obj => {
      return {
        ...obj, 
        selected: true
      };
    });
  }

  /**
   * loads list of stations from localstorage or API if "loadSaved" is true
   * otherwise grabs the selected station from UI
   * 
   * @param {Boolean} loadSaved 
   * @param {HTMLElement} container 
   * 
   * @returns {Array<Object>}
   */
  async getSelectedStations(loadSaved, container) {
    if (loadSaved) {
      try {
        const url = this.#url('/userStations');
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Error fetching user stations: ${res.statusText}`);
        }
        return this.#mapSelected(await res.json());
      } catch(e) {
        return [];
      }
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