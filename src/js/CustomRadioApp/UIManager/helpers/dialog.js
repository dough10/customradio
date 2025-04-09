import loadingAnimation from './insertLoadingAnimation.js';
import Toast from '../../Toast/Toast.js';
import sleep from '../../utils/sleep.js';
import isValidURL from '../../utils/URL.js';


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
async function submitStation(ev) {
  ev.preventDefault();

  
  const submit = document.querySelector('#submit-stream');
  submit.setAttribute('disabled', true);
  
  const responseElement = document.querySelector('#response');
  const fData = new FormData(ev.target);

  try {
    const response = await fetch('/add', {
      method: 'POST',
      body: fData,
    });
    const result = await response.json();
    responseElement.textContent = result.message;
    new Toast(result.message);
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'URL Submission', document.querySelector('#station-url').value, result.message]);
    await sleep(2000);
    const inputElement = document.querySelector('#station-url');
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
 * populate info dialog with details about application
 * 
 * @returns {void}
 */
async function info() {
  const dialog = document.querySelector('#info-dialog');
  const depDiv = document.querySelector('#dependencies');

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
    depDiv.querySelector('.loading').remove();
  }
}


/**
 * shows a greeting dialog to the user
 * 
 * @returns {void}
 */
function greetUser() {
  const hasBeenGreeted = Number(localStorage.getItem('greeted'));
  const greetingElement = document.querySelector('#greeting');

  if (hasBeenGreeted) {
    greetingElement.remove();
    return;
  }

  if (!greetingElement) return;

  greetingElement.showModal();
  // remove after closing
  greetingElement.addEventListener('transitionend', () => {
    if (!greetingElement.hasAttribute('open')) greetingElement.remove();
  });
}

/**
 * dialog interactions
 */
function initDialogInteractions() {
  greetUser();

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

  // submit button for add stream dialog form submission
  const submitButton = document.querySelector('#add-stream');
  submitButton.addEventListener('submit', submitStation);

  // toggle submit button activity on Valid URL input
  const inputElement = document.querySelector('#station-url');
  inputElement.oninput = toggleButtonActivity;
}

/**
 * Cleans up and removes all event listeners added by `initDialogInteractions`.
 */
function destroyDialogInteractions() {
  // Remove wobble animation listeners
  const dialogs = document.querySelectorAll('dialog');
  dialogs.forEach(dialog => dialog.removeEventListener('click', wobbleDialog));

  // Remove close dialog listeners
  document.querySelectorAll('dialog>.close').forEach(el => {
    el.removeEventListener('click', _ => closeDialog(el));
  });

  // Remove info dialog listener
  const infoButton = document.querySelector('#info');
  infoButton.removeEventListener('click', info);

  // Remove add dialog listener
  const addButton = document.querySelector('#add_button');
  addButton.removeEventListener('click', _ => {
    const add = document.querySelector('#add');
    if (add) add.showModal();
  });

  // Remove submit button listener
  const submitButton = document.querySelector('#add-stream');
  submitButton.removeEventListener('submit', submitStation);

  // Remove input element listener
  const inputElement = document.querySelector('#station-url');
  inputElement.oninput = null;
}

export {initDialogInteractions, destroyDialogInteractions};