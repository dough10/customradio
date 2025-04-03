import Toast from './Toast/Toast.js';
import sleep from './utils/sleep.js';
import { queryString } from './utils/queryString.js';
import { createStationElement } from './utils/createStationElement.js';
import AudioPlayer from './utils/audio.js'; 
import insertLoadingAnimation from './utils/5dots.js';
import addDialogInteractions from './utils/dialog.js';
import setSelectedCount from './utils/setSelectedCount.js';
import serviceworkerLoader from './utils/serviceworkerload.js';
import downloadTextfile from './utils/downloadTextfile.js';
import LazyLoader from './utils/LazyLoader.js';

const player = new AudioPlayer();
let lzldr;

/**
 * lists genres currently in the genre filter datalist element
 * 
 * @returns {Array}
 */
function currentGenres() {
  const parent = document.querySelector('#genres');
  const options = Array.from(parent.querySelectorAll('option'));
  return options.map(element => element.value);
}

/**
 * populates a container with "selected" station elements
 * also updates the "selected" count UI
 * 
 * @param {Array} stationList
 * @param {HTMLElement} container 
 */
function populateContainerWithSelected(stationList, container) {
  const localFragment = document.createDocumentFragment();
  stationList.forEach(element => {
    const stationElement = createStationElement(element, player);
    stationElement.toggleAttribute('selected');
    localFragment.append(stationElement);
  });
  setSelectedCount(stationList.length);
  container.append(localFragment);
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
async function filterChanged(ev) {
  ev.target.blur();
  const container = document.querySelector('#stations');
  const stationCount = document.querySelector('#station-count');
  const countParent = stationCount.parentElement;
  try {
    if (lzldr) {
      lzldr.destroy();
      lzldr = null;
    }

    // loading 
    countParent.style.display = 'none';
    insertLoadingAnimation(container);

    // localstorage
    let storedElements = JSON.parse(localStorage.getItem('selected'));

    // variable sent with a filterChange call to determine if localstorage load is needed
    if (ev.loadLocal) {
      // push station elements from localstorage to dom
      if (storedElements) {
        populateContainerWithSelected(storedElements, container);
      }

      // recently searched genres
      await loadGenres();
    }

    // station list from api
    const res = await fetch(`${window.location.origin}/stations${queryString(ev.target.value)}`);
    if (res.status !== 200) {
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
    // maybe really inefficent to load from localstorage and add to DOM and then immediatly replace with the same elements
    // (this also removes the loading element)
    const fragment = document.createDocumentFragment();
    fragment.append(...selectedElements);
    container.scrollTop = 0;
    container.replaceChildren(fragment);

    // append additonal elements, load more when scrolled to 80% of page height
    const toTop = document.querySelector('.to-top');
    let lastTop = 0;
    const toggleDisplayOnScroll = parent => {
      if (parent.scrollTop < lastTop) {
        toTop.classList.add('hidden');
      } else if (parent.scrollTop > 0) {
        toTop.classList.remove('hidden');
      } else {
        toTop.classList.add('hidden');
      }
      lastTop = parent.scrollTop;
    };
    lzldr = new LazyLoader(list, container, player, toggleDisplayOnScroll);
    
    // update station count and display it
    stationCount.textContent = `${stations.length} results`;
    countParent.style.removeProperty('display');

    // update recently searched genres
    if (ev.target.value.length && !currentGenres().includes(ev.target.value)) {
      await loadGenres();
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
 * Reports a JavaScript error to Matomo and logs it to the console.
 *
 * This function constructs an error message from the provided error details,
 * logs the error to the console, and sends the error message to Matomo if the
 * Matomo tracking array (_paq) is available.
 *
 * @function reportErrorToMatomo
 * 
 * @param {string} message - The error message.
 * @param {string} url - The URL where the error occurred.
 * @param {number} lineNumber - The line number where the error occurred.
 * @param {number} columnNumber - The column number where the error occurred.
 * @param {Error} error - The error object.
 */
function reportErrorToMatomo(message, url, lineNumber, columnNumber, error) {
  var errorMessage = `Error: ${message} at ${url}:${lineNumber}:${columnNumber}`;
  if (typeof _paq !== 'undefined') _paq.push(['JavaScript Error', errorMessage || '']);
}

/**
 * creates a datalist element
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

/**
 * loads genres into a datalist element
 */
async function loadGenres() {
  const res = await fetch(`${window.location.origin}/topGenres`);
  if (res.status !== 200) {
    console.error('failed loading genres');
  }
  const jsonData = await res.json()
  const options = jsonData.map(createOption);
  document.querySelector('#genres').replaceChildren(...options);
}

/**
 * window loaded
 */
window.onload = async () => {
  await serviceworkerLoader();

  player.load();

  addDialogInteractions();
  
  const dlButton = document.querySelector('#download');
  dlButton.addEventListener('click', _ => downloadTextfile());
  
  const filter = document.querySelector('#filter');
  filter.addEventListener('change', filterChanged);
  filterChanged({ target: filter, loadLocal: true });

  document.querySelector('.reset').addEventListener('click', _ => {
    if (filter.value === '') return;
    filter.value = '';
    filterChanged({ target: filter});
  });

  const wrapper = document.querySelector('.wrapper');
  const toTop = document.querySelector('.to-top');

  toTop.addEventListener('click', _ => wrapper.scrollTo({
    top: 0,
    behavior: 'smooth'
  }));

  // matomo 
  const alert = document.querySelector('#alert');
  document.querySelector('.alert>.yellow-text').addEventListener('click', async _ => {
    localStorage.setItem('dismissed', '1');
    clearInterval(checkAnalytics);
    alert.removeAttribute('open');
    await sleep(1000);
    alert.remove();
  });

  let dismissed = Number(localStorage.getItem('dismissed'));

  let checkAnalytics = setInterval(_ => {
    const hasChildren = document.querySelectorAll('#matomo-opt-out>*').length;
    if (!hasChildren) return;
    if (dismissed) {
      clearInterval(checkAnalytics);
      alert.remove();
      return;
    }
    if (!alert.hasAttribute('open')) {
      clearInterval(checkAnalytics);
      alert.toggleAttribute('open');
    }
  }, 500);
  // end matomo

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
};

// window.onerror = (message, url, lineNumber, columnNumber, error) => {
//   reportErrorToMatomo(message, url, lineNumber, columnNumber, error);
//   return true;
// };