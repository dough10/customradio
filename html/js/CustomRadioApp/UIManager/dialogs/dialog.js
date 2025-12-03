import EventManager from '../../EventManager/EventManager.js';

import loadingAnimation from '../helpers/insertLoadingAnimation.js';
import Toast from '../../Toast/Toast.js';
import sleep from '../../utils/sleep.js';
import isValidURL from '../../utils/URL.js';
import hapticFeedback from '../../utils/hapticFeedback.js';
import selectors from '../../selectors.js';
import _OPTIONS from '../../utils/post_options.js';
import updateCsrf from '../../utils/updateCsrf.js';
import retry from '../../utils/retry.js';
import {t} from '../../utils/i18n.js';

const em = new EventManager();

/**
 * Dialog for sharing user download link
 */
class ShareDialog {
  constructor() {
    em.add(document.querySelector(selectors.sharelink), 'click', this._open.bind(this), { passive: true });
    
    // copy link to clipboard
    const copyLinkButton = document.querySelector(selectors.copyLink);
    em.add(copyLinkButton, 'click', this._copytoclipboard.bind(this));

    // share to facebook
    const facebookshare = document.querySelector(selectors.fbShare);
    em.add(facebookshare, 'click',  this._shareToFacebook.bind(this));    
  }

  /**
   * opens the share dialog
   * 
   * @returns {void}
   */
  _open() {
    document.querySelector(selectors.shareDialog).showModal();
  }

  /**
   * shares the user download link to facebook
   * 
   * @returns {void}
   */
  _shareToFacebook() {
    hapticFeedback();
    const shareUrl = encodeURIComponent(document.querySelector(selectors.shareInput).value);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    window.open(facebookUrl, '_blank', 'noopener');
  }


  /**
   * shares the user download link to facebook
   * 
   * @returns {void}
   */  
  async _copytoclipboard() {
    if (!window.user) return;

    const linkInput = document.querySelector(selectors.shareInput);
    const messageElement = document.querySelector(selectors.shareMessage);
    
    if (!linkInput || !messageElement) {
      console.error('Required clipboard elements not found');
      return;
    }

    const successMessage = t('clipboard_success');
    const failureMessage = t('clipboard_failure');

    try {
      hapticFeedback();
      await navigator.clipboard.writeText(linkInput.value);
      messageElement.textContent = successMessage;
      new Toast(successMessage);
    } catch (err) {
      messageElement.textContent = failureMessage;
      new Toast(failureMessage);
      console.error(err);
    } finally {
      await sleep(3000);
      messageElement.textContent = '';
    }
  }
}

/**
 * Dialog for showing application info
 */
class InfoDialog {
  constructor() {
    em.add(document.querySelector(selectors.infoButton), 'click', this._info.bind(this));
  }

  /**
   * removes ^ if it is the first char in a string
   * 
   * @param {String} str
   *  
   * @returns {String} string without ^
   */
  _rmArrow(str) {
    if (str.charAt(0) === "^") {
      return str.slice(1);
    }
    return str;
  }

  /**
   * creates html elements for most recent 3 versions of changelog
   * 
   * @param {Object} changes - changelog object from backend
   * 
   * @returns {HTMLElement} document fragment containing HTMLElements
   */
  _createChangelog(changes) {
    const fragment = document.createDocumentFragment();
    let count = 0;
    
    for (const version in changes) {
      if (count++ >= 3) break;

      const header = document.createElement('h3');
      header.textContent = `${version}:`;

      const list = document.createElement('ul');
      
      const items = changes[version].map(change => {
        const li = document.createElement('li');
        li.textContent = change.replace(/\s*\(.*?\)\s*/g, ' ').trim();
        return li;
      });
      
      list.append(...items);
      fragment.append(header, list);
    }
    
    return fragment;
  }

  /**
   * creates html elements for application dependencies 
   * 
   * @param {Array} entrys
   *  
   * @returns {HTMLElement}
   */
  _createList(entrys) {
    const fragment = document.createDocumentFragment();
    
    const items = Object.entries(entrys).map(([key, value]) => {
      const li = document.createElement('li');
      li.textContent = `${key}: ${this._rmArrow(value)}`;
      return li;
    });
    
    fragment.append(...items);
    return fragment;
  }

  /**
   * populate info dialog with details about application
   * 
   * @returns {void}
   */
  async _info() {
    const dialog = document.querySelector(selectors.infoDialog);
    const depDiv = dialog.querySelector(selectors.dependencies);
    const changelog = dialog.querySelector(selectors.changelog);

    hapticFeedback();

    dialog.showModal();

    if (depDiv.querySelectorAll('*').length > 5) return;

    loadingAnimation(depDiv);

    try {
      const response = await retry(_ => fetch('/info'));
      const pack = await response.json();

      dialog.querySelector('h1').textContent = `v${pack.version}`;
      
      const changes = this._createChangelog(pack.changelog);
      changelog.append(changes);

      const dependencies = this._createList(pack.dependencies);
      depDiv.append(dependencies);
    } catch (error) {
      const message = `Error fetching dependencies: ${error.message}`;
      console.error(message);
      new Toast(message, 3);
    } finally {
      depDiv.querySelector(selectors.loading)?.remove();
    }
  }
}

/**
 * Dialog for adding a new stream
 */
class AddStreamDialog {
  constructor() {
    // opens add  stream dialog
    const addButton = document.querySelector(selectors.add);
    em.add(addButton, 'click', this._openAddDialog.bind(this));
    
    // submit button for add stream dialog form submission
    const stationSubmitForm = document.querySelector(selectors.stationSubmitForm);
    em.add(stationSubmitForm, 'submit', this._submitStation.bind(this));
    
    // toggle submit button activity on Valid URL input
    const inputElement = document.querySelector(selectors.stationUrl);
    em.add(inputElement, 'input', this._toggleButtonActivity.bind(this));
  }

  /**
   * opens the add stream dialog
   */
  _openAddDialog() {
    hapticFeedback();
    const add = document.querySelector(selectors.addDialog);
    if (add) add.showModal();
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
   * @function _formSubmission
   * 
   * @param {Event} ev - The form submission event.
   * 
   * @returns {Promise<void>} - A promise that resolves when the form submission handling is complete.
   * 
   * @throws {Error} - Throws an error if the fetch request fails.
   */
  async _submitStation(ev) {
    const SUBMISSION_RESET_TIME = 2000;

    ev.preventDefault();

    const submit = document.querySelector(selectors.stationSubmit);
    const responseElement = document.querySelector(selectors.response);
    const stationUrlElement = document.querySelector(selectors.stationUrl);

    if (!submit || !responseElement || !stationUrlElement) {
      console.error('Required DOM elements not found');
      return;
    }

    submit.setAttribute('disabled', true);
    const url = stationUrlElement.value;

    try {
      const post_options = _OPTIONS({url});
      const response = await retry(_ => fetch('/add', post_options));
      
      if ([403, 419, 440].includes(response?.status)) {
        const success = await updateCsrf();
        if (success) await this._submitStation(ev);
        return;
      }

      if (!response) throw Error('network error adding Station');
      
      const result = await response.json();
      const message = result.message;
      
      responseElement.textContent = message;
      if (message.length) new Toast(message);
      if (typeof _paq !== 'undefined') {
        _paq.push(['trackEvent', 'URL Submission', url, message]);
      }

      await sleep(SUBMISSION_RESET_TIME);
      stationUrlElement.value = '';
      responseElement.innerText = '';
    } catch (e) {
      responseElement.textContent = 'An error occurred!';
      console.error(`Error: ${e.message}`);
      if (typeof _paq !== 'undefined') {
        _paq.push(['trackEvent', 'Error', e.message || 'Could not get Message']);
      }
    }
  }
  
  /**
   * Toggles the activity state of the submit button based on the validity of the URL input.
   *
   * This function selects the input element and the submit button, checks if the URL
   * provided in the input element is valid, and enables or disables the submit button
   * accordingly.
   *
   * @function _toggleButtonActivity
   */
  _toggleButtonActivity() {
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
}

/**
 * Manages dialog interactions within the application.
 */
class Dialogs {
  constructor() {
    // animation telling user to click the x
    const dialogs = document.querySelectorAll('dialog');
    dialogs.forEach(dialog => em.add(dialog, 'click', this._wobbleDialog.bind(this)));
    
    // close dialogs
    document.querySelectorAll(selectors.dialogClose).forEach(el => {
      em.add(el, 'click', _ => this._closeDialog(el));
    });

    new InfoDialog();
    new AddStreamDialog();
    new ShareDialog();
  }

  /**
   * closes an opened dialog
   * 
   * @param {HTMLElement} el 
   */
  _closeDialog(el) {
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
  _wobbleDialog(ev) {
    // elements
    const dialog = ev.target;
    const namespace = 'wobble-animation';
    const closeButton = dialog.querySelector(selectors.smallDialogCloseButton);
    const bigCloseButton = dialog.querySelector(selectors.dialogCloseButton);

    // animation ended callback
    // removes classes after animation plays
    const animationend = _ => {
      em.removeByNamespace(namespace);
      if (closeButton) closeButton.classList.remove('attention');
      if (bigCloseButton) bigCloseButton.classList.remove('button-attention');
      dialog.classList.remove('dialog-attention');
    };

    // dialog location and click position
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX && event.clientX <= rect.left + rect.width);

    // if the click was outside the dialog, add wobble animation
    if (!isInDialog) {
      em.add(dialog, 'animationend', animationend, true, namespace);
      if ('vibrate' in navigator) navigator.vibrate([20, 100, 20]);
      if (closeButton) closeButton.classList.add('attention');
      if (bigCloseButton) bigCloseButton.classList.add('button-attention');
      dialog.classList.add('dialog-attention');
    }
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
 * dialog interactions
 * 
 * @returns {void}
 */
function initDialogInteractions() {
  new Dialogs();

  greetUser();
}

/**
 * Cleans up and removes all event listeners added by `initDialogInteractions`.
 */
function destroyDialogInteractions() {
  em.removeAll();
}

export {initDialogInteractions, destroyDialogInteractions};