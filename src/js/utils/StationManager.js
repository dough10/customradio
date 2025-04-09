import queryString from './queryString.js';
import retryFetch from './retryFetch.js';

export default class StationManager {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async fetchStations(genreFilter) {
    const res = await retryFetch(`${this.apiBaseUrl}/stations${queryString(genreFilter)}`);
    if (res.status !== 200) {
      throw new Error(`Error fetching stations: ${res.statusText}`);
    }
    return res.json();
  }

  filterStations(selected, stations) {
    const selectedUrls = new Set(selected.map(({ url }) => url));
    return stations.filter(({ url }) => !selectedUrls.has(url));
  }

  async getGenres() {
    const res = await retryFetch(`${this.apiBaseUrl}/topGenres`);
    if (res.status !== 200) {
      throw new Error(`Error fetching genres: ${res.statusText}`);
    }
    return await res.json();
  }

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