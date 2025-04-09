import {initDialogInteractions, destroyDialogInteractions} from './dialog.js';
import insertLoadingAnimation from './5dots.js';

/**
 * creates a datalist option element
 * 
 * @param {String} str 
 * 
 * @returns {HTMLElement}
 */
function createOption(str) {
  const option = document.createElement('option');
  option.value = str;
  return option;
}

export default class UIManager {
  constructor(selectors) {
    this._selectors = selectors;
    this._lastTop = 0;
    this._toTop = document.querySelector(this._selectors.toTop);

    this.toggleDisplayOnScroll = this.toggleDisplayOnScroll.bind(this);
  }

  /**
   * attach UI listeners
   * 
   * @param {Object} param0
   * @param {Function} param0.onFilterChange
   * @param {Function} param0.onReset 
   */
  attachListeners({ onFilterChange, onReset }) {
    initDialogInteractions();

    const filter = document.querySelector(this._selectors.filter);
    filter.addEventListener('change', onFilterChange);

    const resetButton = document.querySelector(this._selectors.resetButton);
    resetButton.addEventListener('click', onReset);

    const toTop = document.querySelector(this._selectors.toTop);
    toTop.addEventListener('click', this._toTopHandler.bind(this));
  }

  /**
   * remove UI listeners
   * 
   * @param {Object} param0
   * @param {Function} param0.onFilterChange
   * @param {Function} param0.onReset 
   */
  detachListeners({ onFilterChange, onReset }) {
    destroyDialogInteractions();

    const filter = document.querySelector(this._selectors.filter);
    filter.removeEventListener('change', onFilterChange);

    const resetButton = document.querySelector(this._selectors.resetButton);
    resetButton.removeEventListener('click', onReset);

    const toTop = document.querySelector(this._selectors.toTop);
    toTop.removeEventListener('click', this._toTopHandler.bind(this));
  }

  /**
   * toggles the display of the "to top" button on scroll
   * 
   * @param {HTMLElement} parent 
   */
  toggleDisplayOnScroll(parent) {
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
   * sets the station counts in the UI
   * 
   * @param {Number} selected 
   * @param {Number} total 
   */
  setCounts(selected, total) {
    const count = document.querySelector('#count');
    const dlButton = document.querySelector(this._selectors.downloadButton);
    count.textContent = `${selected} station${selected === 1 ? '' : 's'} selected`;
    if (selected > 0) {
      dlButton.removeAttribute('disabled');
    } else {
      if (!dlButton.hasAttribute('disabled')) {
        dlButton.toggleAttribute('disabled');
      }
    }
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.textContent = `${total} results`;
  }

  /**
   * gets the current genres from the UI
   * 
   * @returns {Array} list of genres
   */
  currentGenres() {
    const parent = document.querySelector(this._selectors.genres);
    const options = Array.from(parent.querySelectorAll('option'));
    return options.map(element => element.value);
  }

  /**
   * loads genres into a datalist element
   */
  async loadGenres(genres) {
    const options = genres.map(createOption);
    document.querySelector(this._selectors.genres).replaceChildren(...options);
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
   * creates a loading animation in the given element
   * 
   * @param {HTMLElement} container - element to place a loadin animation
   */
  loadingStart(container) {
    insertLoadingAnimation(container);
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.parentElement.style.display = 'none';
  }

  /**
   * removes the loading animation
   */
  loadingEnd() {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    const stationCount = document.querySelector(this._selectors.stationCount);
    stationCount.parentElement.style.removeProperty('display');
  }

  /**
   * toggle visability of selected element
   */
  toggleSelectedVisability() {
    const selected = document.querySelectorAll('#stations>li[selected]');
    const current = selected[0].style.display;
    selected.forEach(el => {
      if (current === 'none') {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  }
}
