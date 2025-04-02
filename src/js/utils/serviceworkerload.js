import Toast from '../Toast/Toast.js'

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

export default async function load() {
  if ('serviceWorker' in navigator) {
    await callServiceWorker()
  }
}