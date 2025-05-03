import EventManager from '../../utils/EventManager/EventManager.js';

import loadingAnimation from './insertLoadingAnimation.js';
import Toast from '../../Toast/Toast.js';
import sleep from '../../utils/sleep.js';
import isValidURL from '../../utils/URL.js';
import hapticFeedback from '../../utils/hapticFeedback.js';
import selectors from '../../selectors.js';

const em = new EventManager();

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
  const inputElement = document.querySelector(selectors.stationUrl);
  const submitButton = document.querySelector(selectors.stationSubmit);

  const url = inputElement.value;
  const isValid = isValidURL(url);
  const isDisabled = submitButton.hasAttribute('disabled');

  if (isValid && isDisabled) {
    submitButton.removeAttribute('disabled');
  } else if (!isValid && !isDisabled) {
    submitButton.toggleAttribute('disabled');
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
 * 
 * @param {Event} ev - The form submission event.
 * 
 * @returns {Promise<void>} - A promise that resolves when the form submission handling is complete.
 * 
 * @throws {Error} - Throws an error if the fetch request fails.
 */
async function submitStation(ev) {
  ev.preventDefault();

  
  const submit = document.querySelector(selectors.stationSubmit);
  submit.setAttribute('disabled', true);
  
  const responseElement = document.querySelector(selectors.response);
  const fData = new FormData(ev.target);

  try {
    const response = await fetch('/add', {
      method: 'POST',
      body: fData,
    });
    const result = await response.json();
    const message = result.message;
    responseElement.textContent = message;
    if (message.length) new Toast(result.message);
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'URL Submission', document.querySelector(selectors.stationUrl).value, message]);
    await sleep(2000);
    const inputElement = document.querySelector(selectors.stationUrl);
    inputElement.value = '';
    document.getElementById('response').innerText = '';
  } catch (e) {
    submit.removeAttribute('disabled');
    responseElement.textContent = 'An error occurred!';
    console.error(`Error: ${e.message}`);
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Error', e.message || 'Could not get Message']);
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
 * closes an opened dialog
 * 
 * @param {HTMLElement} el 
 */
function closeDialog(el) {
  hapticFeedback();
  const dialog = el.parentElement;
  dialog.close();
  if (dialog.id === 'greeting') {
    localStorage.setItem('greeted', '1');
  }
}

/**
 * Bring users attention to the open dialog when clicked outside the dialog
 * 
 * @param {Event} event 
 */
function wobbleDialog(ev) {
  // elements
  const dialog = ev.target;
  const closeButton = dialog.querySelector(selectors.smallDialogCloseButton);
  const bigCloseButton = dialog.querySelector(selectors.dialogCloseButton);

  let animationListener = null;

  // animation ended callback
  // removes classes after animation plays
  const animationend = _ => {
    dialog.removeEventListener('animationend', animationend);
    if (animationListener) em.remove(animationListener);
    animationListener = null;
    if (closeButton) closeButton.classList.remove('attention');
    if (bigCloseButton) bigCloseButton.classList.remove('button-attention');
    dialog.classList.remove('dialog-attention');
  };

  // dialog location and click position
  var rect = dialog.getBoundingClientRect();
  var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX && event.clientX <= rect.left + rect.width);

  // if the click was outside the dialog, add wobble animation
  if (!isInDialog) {
    animationListener = em.add(dialog, 'animationend', animationend);
    if ('vibrate' in navigator) navigator.vibrate([20, 100, 20]);
    if (closeButton) closeButton.classList.add('attention');
    if (bigCloseButton) bigCloseButton.classList.add('button-attention');
    dialog.classList.add('dialog-attention');
  }
}

/**
 * populate info dialog with details about application
 * 
 * @returns {void}
 */
async function info() {
  const dialog = document.querySelector(selectors.infoDialog);
  const depDiv = document.querySelector(selectors.dependencies);

  hapticFeedback();

  dialog.showModal();

  if (depDiv.querySelectorAll('*').length > 5) return;

  loadingAnimation(depDiv);

  try {
    const response = await fetch('/info');
    const pack = await response.json();

    dialog.querySelector('h1').textContent = `v${pack.version}`;

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
    depDiv.querySelector(selectors.loading).remove();
  }
}


/**
 * shows a greeting dialog to the user
 * 
 * @returns {void}
 */
function greetUser() {
  const hasBeenGreeted = Number(localStorage.getItem('greeted'));
  const greetingElement = document.querySelector(selectors.greeting);

  if (hasBeenGreeted) {
    greetingElement.remove();
    return;
  }

  if (!greetingElement) return;

  greetingElement.showModal();

  // remove after closing
  const gClose = em.add(greetingElement, 'transitionend', () => {
    if (!greetingElement.hasAttribute('open')) {
      em.remove(gClose);
      greetingElement.remove();
    }
  });
}

/**
 * opens the add stream dialog
 */
function openAddDialog() {
  hapticFeedback();
  const add = document.querySelector(selectors.addDialog);
  if (add) add.showModal();
}

/**
 * dialog interactions
 */
function initDialogInteractions() {
  // animation telling user to click the x
  const dialogs = document.querySelectorAll('dialog');
  dialogs.forEach(dialog => em.add(dialog, 'click', wobbleDialog));
  
  // close dialogs
  document.querySelectorAll(selectors.dialogClose).forEach(el => {
    em.add(el, 'click', _ => closeDialog(el));
  });
  
  //info
  em.add(document.querySelector(selectors.infoButton), 'click', info);
  
  // add  stream dialog
  const addButton = document.querySelector(selectors.add);
  em.add(addButton, 'click', openAddDialog);
  
  // submit button for add stream dialog form submission
  const stationSubmitForm = document.querySelector(selectors.stationSubmitForm);
  em.add(stationSubmitForm, 'submit', submitStation);
  
  // toggle submit button activity on Valid URL input
  const inputElement = document.querySelector(selectors.stationUrl);
  em.add(inputElement, 'input', toggleButtonActivity);
  
  greetUser();
}

/**
 * Cleans up and removes all event listeners added by `initDialogInteractions`.
 */
function destroyDialogInteractions() {
  em.removeAll();
}

export {initDialogInteractions, destroyDialogInteractions};