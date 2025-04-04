import sleep from './utils/sleep.js';
import CustomRadioApp from './utils/CustomRadioApp.js';

const app = new CustomRadioApp();

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
 * window loaded
 */
window.onload = async () => {
  app.init();
  
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