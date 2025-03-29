import Toast from './Toast/Toast.js';
import sleep from './utils/sleep.js';
import { isValidURL } from './utils/URL.js';
import { stamp } from './utils/timestamp.js';
import { queryString } from './utils/queryString.js';
import { createStationElement } from './utils/createStationElement.js';
import { createSmallButton } from './utils/createSmallButton.js';
import AudioPlayer from './utils/audio.js'; 

const player = new AudioPlayer();

/**
 * Creates a loading animation in the element passed to the input
 * 
 * @param {HTMLElement} parent 
 * 
 * @returns {void}
 */
function loadingAnimation(parent) {
  if (parent.querySelector('.loading')) return;
  const div = document.createElement('div');
  div.classList.add('loading');
  for (let i = 0; i < 5; i++) {
    const circle = document.createElement('div');
    circle.classList.add('circle');
    div.append(circle);
  }
  parent.prepend(div);
}

/**
 * Updates the selected count displayed on the page and manages the state of the download button.
 * 
 * This function updates the text content of the element with the ID `#count` to display the provided number. 
 * It also enables or disables the download button (`#download`) based on whether the number is greater than zero.
 * If a global `_paq` tracking object is available, the function sends events to it based on the state of the button.
 * 
 * @param {number} number - The number to set as the selected count.
 * 
 * @fires _paq.push - If `_paq` is defined, the function tracks events related to enabling or disabling the download button.
 */
function setSelectedCount(number) {
  const count = document.querySelector('#count');
  const dlButton = document.querySelector('#download');
  count.textContent = `${number} station${number === 1 ? '' : 's'} selected`;
  if (number) {
    dlButton.removeAttribute('disabled');
  } else {
    if (!dlButton.hasAttribute('disabled')) {
      dlButton.toggleAttribute('disabled');
    }
  }
}

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
 * Handles the form submission event.
 *
 * This function prevents the default form submission behavior, collects the form data,
 * and sends it to the server via a POST request. It then handles the server response,
 * updates the UI accordingly, and manages the form state. In case of an error, it
 * displays an error message and logs the error to the console.
 *
 * @async
 * @function formSubmission
 * @param {Event} ev - The form submission event.
 * 
 * @returns {Promise<void>} - A promise that resolves when the form submission handling is complete.
 * 
 * @throws {Error} - Throws an error if the fetch request fails.
 */
async function formSubmission(ev) {
  ev.preventDefault();

  const submit = document.querySelector('#submit-stream');
  submit.setAttribute('disabled', true);

  const fData = new FormData(ev.target);

  try {
    const response = await fetch('/add', {
      method: 'POST',
      body: fData,
    });

    const result = await response.json();
    document.getElementById('response').innerText = result.message;
    new Toast(result.message);
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'URL Submission', document.querySelector('#station-url').value, result.message]);
    await sleep(2000);
    const inputElement = document.querySelector('#station-url');
    inputElement.value = '';
    document.getElementById('response').innerText = '';
  } catch (e) {
    submit.removeAttribute('disabled');
    document.getElementById('response').innerText = 'An error occurred!';
    console.error(`Error: ${e.message}`);
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Error', e.message || 'Could not get Message']);
  }
}

/**
 * Toggles the activity state of the submit button based on the validity of the URL input.
 *
 * This function selects the input element and the submit button, checks if the URL
 * provided in the input element is valid, and enables or disables the submit button
 * accordingly.
 *
 * @function toggleButtonActivity
 */
function toggleButtonActivity() {
  const inputElement = document.querySelector('#station-url');
  const submit = document.querySelector('#submit-stream');

  if (isValidURL(inputElement.value)) {
    submit.removeAttribute('disabled');
  } else {
    if (!submit.hasAttribute('disabled')) {
      submit.toggleAttribute('disabled');
    }
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
 * Bring users attention to the open dialog when clicked outside the dialog
 * 
 * @param {Event} event 
 */
function wobbleDialog(event) {
  const dialog = event.target;
  const closeButton = dialog.querySelector('.small-button.close');
  const bigCloseButton = dialog.querySelector('.button.close');
  const animationend = _ => {
    dialog.removeEventListener('animationend', animationend);
    if (closeButton) closeButton.classList.remove('attention');
    if (bigCloseButton) bigCloseButton.classList.remove('button-attention');
    dialog.classList.remove('dialog-attention');
  };
  var rect = dialog.getBoundingClientRect();
  var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
  if (!isInDialog) {
    dialog.addEventListener('animationend', animationend);
    if (closeButton) closeButton.classList.add('attention');
    if (bigCloseButton) bigCloseButton.classList.add('button-attention');
    dialog.classList.add('dialog-attention');
  }
}

/**
 * close the opened dialog
 * 
 * @param {HTMLElement} el 
 */
function closeDialog(el) {
  const dialog = el.parentElement;
  dialog.close();
  if (dialog.id === 'greeting') {
    localStorage.setItem('greeted', '1');
  }
}

/**
 * removes ^ if it is the first char in a string
 * 
 * @param {String} str
 *  
 * @returns {String} string without ^
 */
function rmArrow(str) {
  if (str.charAt(0) === "^") {
    return str.slice(1);
  }
  return str;
}

/**
 * populate info dialog with details about application
 * 
 * @returns {void}
 */
async function info() {
  const depDiv = document.querySelector('#dependencies');
  document.querySelector('#info-dialog').showModal();
  if (depDiv.querySelectorAll('*').length > 5) return;
  loadingAnimation(depDiv);
  try {
    const response = await fetch('/info');
    const pack = await response.json();
    document.querySelector('#info-dialog>h1').textContent = `v${pack.version}`;
    const fragment = document.createDocumentFragment();
    Object.entries(pack.dependencies).forEach(([key, value]) => {
      const li = document.createElement('li');
      li.textContent = `${key}: ${rmArrow(value)}`;
      fragment.appendChild(li);
    });
    depDiv.append(fragment);
  } catch (error) {
    const message = `Error fetching dependencies: ${error.message}`;
    console.error(message);
    new Toast(message, 3);
  } finally {
    depDiv.querySelector('.loading').remove();
  }
}

/**
 * dialog interactions
 */
function addDialogInteractions() {
  // animation telling user to click the x
  const dialogs = document.querySelectorAll('dialog');
  dialogs.forEach(dialog => dialog.addEventListener('click', wobbleDialog));

  // close dialogs
  document.querySelectorAll('dialog>.close').forEach(el => {
    el.addEventListener('click', _ => closeDialog(el));
  });

  //info
  document.querySelector('#info').addEventListener('click', info);

  // add
  const add = document.querySelector('#add');
  const addButton = document.querySelector('#add_button');
  addButton.addEventListener('click', _ => add.showModal());
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

  const form = document.querySelector('#add-stream');
  form.addEventListener('submit', formSubmission);

  const inputElement = document.querySelector('#station-url');
  inputElement.oninput = toggleButtonActivity;


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

export {
  createSmallButton
};

// window.onerror = (message, url, lineNumber, columnNumber, error) => {
//   reportErrorToMatomo(message, url, lineNumber, columnNumber, error);
//   return true;
// };