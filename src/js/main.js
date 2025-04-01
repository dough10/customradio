import Toast from './Toast/Toast.js';
import sleep from './utils/sleep.js';
import { stamp } from './utils/timestamp.js';
import { queryString } from './utils/queryString.js';
import { createStationElement } from './utils/createStationElement.js';
import AudioPlayer from './utils/audio.js'; 
import loadingAnimation from './utils/5dots.js';
import addDialogInteractions from './utils/dialog.js';
import setSelectedCount from './utils/setSelectedCount.js';

const player = new AudioPlayer();

/**
 * generates a text file download from selected items
 * 
 * @function
 * 
 * @returns {void}
 */
async function dlTxt() {
  const container = document.querySelector('#stations');
  const elements = Array.from(container.querySelectorAll('li[selected]'));
  const str = elements.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name))
    .map(el => `${el.dataset.name}, ${el.dataset.url}`).join('\n');

  const blob = new Blob([`${stamp()}\n${str}`], {
    type: 'text/plain'
  });

  const filename = 'radio.txt';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.append(link);

  if (typeof _paq !== 'undefined') _paq.push(['trackLink', 'download', link.href]);

  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * calculate how many station elements can fit in the current browser window height
 * 
 * @returns {Number} number of elements that will fit in browser window height
 */
function getPullCount() {
  return Math.round(window.innerHeight / 58);
}

/**
 * load more stations to the UI when user scrolls to end of loaded content
 * 
 * @function
 * 
 * @param {Array} list 
 * @param {HTMLElement} container
 * 
 * @returns {void} 
 */
function lazyLoadOnScroll(list, container) {
  let ndx = 0;
  let pullNumber = getPullCount();
  let loading = false;
  let lastTop = 0;

  function load() {
    if (loading || ndx >= list.length) return;
    loading = true;
    const slices = list.slice(ndx, ndx + pullNumber);
    const fragment = document.createDocumentFragment();
    slices.forEach(slice => {
      const stationEl = createStationElement(slice, player);
      slice.name = slice.name.replace(/,/g, '');
      fragment.append(stationEl);
    });
    container.append(fragment);
    ndx += pullNumber;
    loading = false;
  }

  window.addEventListener('resize', _ => {
    const adjusted = getPullCount();
    if (adjusted > pullNumber) {
      pullNumber = adjusted;
      load();
    }
  });

  const parent = container.parentElement;
  const toTop = document.querySelector('.to-top');

  parent.onscroll = _ => {
    if (parent.scrollTop < lastTop) {
      toTop.classList.add('hidden');
    } else if (parent.scrollTop > 0) {
      toTop.classList.remove('hidden');
    } else {
      toTop.classList.add('hidden');
    }
    lastTop = parent.scrollTop;
    if (parent.scrollTop / (parent.scrollHeight - parent.clientHeight) >= 0.8) {
      load();
    }
  };

  load();
}

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
    countParent.style.display = 'none';
    loadingAnimation(container);
    let storedElements = JSON.parse(localStorage.getItem('selected'));
    if (ev.loadLocal) {
      if (storedElements) {
        const localFragment = document.createDocumentFragment();
        const elements = storedElements.map(element => createStationElement(element, player));
        elements.forEach(el => {
          el.toggleAttribute('selected');
          localFragment.append(el);
        });
        setSelectedCount(elements.length);
        container.append(localFragment);
      }
      await loadGenres();
    }
    const res = await fetch(`${window.location.origin}/stations${queryString(ev.target.value)}`);
    if (res.status !== 200) {
      return;
    }
    const stations = await res.json();
    const selectedElements = Array.from(container.querySelectorAll('li[selected]'))
      .sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
    const selectedUrls = new Set(selectedElements.map(el => el.dataset.url));
    const list = stations.filter(station => !selectedUrls.has(station.url));
    const fragment = document.createDocumentFragment();
    fragment.append(...selectedElements);
    container.scrollTop = 0;
    container.replaceChildren(fragment);
    lazyLoadOnScroll(list, container);
    stationCount.textContent = `${stations.length} results`;
    countParent.style.removeProperty('display');
    if (ev.target.value.length && !currentGenres().includes(ev.target.value)) {
      await loadGenres();
    }
    if (typeof _paq !== 'undefined' && ev.target.value.length) _paq.push(['trackEvent', 'Filter', ev.target.value || '']);
  } catch (error) {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    countParent.style.removeProperty('display');
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Fetch Error', error || 'Could not get Message']);
    console.error('Error fetching stations:', error);
    new Toast('Error fetching stations:', error);
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
 * An update was installed for the active service worker
 * 
 * @param {Object} newWorker 
 * 
 * @returns {void}
 */
function updateInstalled(newWorker) {
  if (newWorker.state !== 'installed') return;
  if (!navigator.serviceWorker.controller) return;
  new Toast('App updated', 15, _ => newWorker.postMessage({ action: 'skipWaiting' }), 'Press to refresh');
}

/**
 * An update was found to the service worker cache
 * 
 * @param {Object} worker
 */
function updateFound(worker) {
  const newWorker = worker.installing;
  newWorker.onstatechange = _ => updateInstalled(newWorker);
}

/**
 * service worker controller changed
 * 
 * @returns {void}
 */
let refreshing = false;
function controllerChange() {
  if (refreshing) return;
  refreshing = true;
  console.log('Controller has changed, reloading the page...');
  window.location.reload(true);
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
 * service worker
 */
async function callServiceWorker() {
  try {
    navigator.serviceWorker.addEventListener('controllerchange', controllerChange);
    const worker = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
    worker.onupdatefound = () => updateFound(worker);
  } catch (error) {
    console.log('ServiceWorker registration failed: ', error);
  }
}

/**
 * window loaded
 */
window.onload = async () => {
  if ('serviceWorker' in navigator) {
    await callServiceWorker()
  }

  player.load();

  addDialogInteractions();
  
  const dlButton = document.querySelector('#download');
  dlButton.addEventListener('click', dlTxt);
  
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