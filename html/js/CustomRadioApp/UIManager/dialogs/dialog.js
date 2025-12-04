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

const MAX_CSRF_RETRIES = 1;
const SUBMISSION_RESET_TIME = 2000;

const em = new EventManager();

/**
 * Dialog for sharing user download link
 */
class ShareDialog {
  constructor() {
    em.add(this._shareLink, 'click', this._open.bind(this));
    
    // copy link to clipboard
    em.add(this._copyLinkButton, 'click', this._copytoclipboard.bind(this));

    // share to facebook
    em.add(this._facebookshare, 'click',  this._shareToFacebook.bind(this));
    
    // share to twitter
    em.add(this._twittershare, 'click',  this._shareToTwitter.bind(this));

    // share to email
    em.add(this._emailshare, 'click',  this._shareToEmail.bind(this));

    // share to sms
    em.add(this._smsshare, 'click',  this._shareToSMS.bind(this));
  }

  /**
   * gets share dialog
   * 
   * @returns {HTMLElement} share dialog
   */
  get _dialog() {
    return document.querySelector(selectors.shareDialog);
  }

  /**
   * gets share link button
   * 
   * @returns {HTMLElement} share link button
   */
  get _shareLink() {
    return document.querySelector(selectors.sharelink);
  }

  /**
   * gets copy link button
   * 
   * @returns {HTMLElement} copy link button
   */
  get _copyLinkButton() {
    return document.querySelector(selectors.copyLink);
  }

  /**
   * gets facebook share button
   * 
   * @returns {HTMLElement} facebook share button
   */
  get _facebookshare() {
    return document.querySelector(selectors.fbShare);
  }

  /**
   * gets twitter share button
   * 
   * @returns {HTMLElement} twitter share button
   */
  get _twittershare() {
    return document.querySelector(selectors.twitterShare);
  }

  /**
   * gets email share button
   * 
   * @returns {HTMLElement} email share button
   */
  get _emailshare() {
    return document.querySelector(selectors.emailShare);
  }

  /**
   * gets sms share button
   * 
   * @returns {HTMLElement} sms share button
   */
  get _smsshare() {
    return document.querySelector(selectors.smsShare);
  }

  /**
   * gets the share URL from input field
   * 
   * @returns {String} share URL
   */
  get _shareURL() {
    const url = new URL(`/txt/${window.user.id.replace('user_', '')}`, window.location.origin);
    return url.toString();
  }

  /**
   * opens the share dialog
   * 
   * @returns {void}
   */
  _open() {
    if (!window.user) return;
    this._dialog.showModal();
  }

  /**
   * shares the user download link to facebook
   * 
   * @returns {void}
   */
  _shareToFacebook() {
    hapticFeedback();
    const shareUrl = encodeURIComponent(this._shareURL);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    window.open(facebookUrl, '_blank', 'noopener');
  }

  /**
   * shares the user download link to twitter
   * 
   * @returns {void}
   */
  _shareToTwitter() {
    hapticFeedback();
    const shareUrl = encodeURIComponent(this._shareURL);
    const twitterUrl = "https://x.com/intent/post?" + new URLSearchParams({
      url: shareUrl,
      text: "My radio.txt download link:",
      hashtags: "sharing,radiotxt,customradio"
    }).toString();
    window.open(twitterUrl, '_blank', 'noopener');
  }

  /**
   * shares the user download link to sms
   * 
   * @returns {void}
   */
  _shareToSMS() {
    hapticFeedback();
    const body = encodeURIComponent(`My radio.txt download link: ${this._shareURL}`);
    // iOS/Android vary; use generic sms: URI
    window.open(`sms:?&body=${body}`, '_blank', 'noopener');
  }

  /**
   * shares the user download link to email
   * 
   * @returns {void}
   */
  _shareToEmail() {
    hapticFeedback();
    const subject = encodeURIComponent('My radio.txt download link');
    const body = encodeURIComponent(this._shareURL);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener');
  }

  /**
   * shares the user download link to facebook
   * 
   * @returns {void}
   */  
  async _copytoclipboard() {
    if (!window.user) return;

    const messageElement = document.querySelector(selectors.shareMessage);
    
    if (!messageElement) {
      console.error('Required clipboard elements not found');
      return;
    }

    const successMessage = t('clipboard_success');
    const failureMessage = t('clipboard_failure');

    try {
      hapticFeedback();
      await navigator.clipboard.writeText(this._shareURL);
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
    em.add(this._infoButton, 'click', this._info.bind(this));
  }

  /**
   * gets info button
   * 
   * @returns {HTMLElement} info button
   */
  get _infoButton() {
    return document.querySelector(selectors.infoButton);
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
    em.add(this._addButton, 'click', this._openAddDialog.bind(this));
    
    // submit button for add stream dialog form submission
    em.add(this._stationSubmitForm, 'submit', this._submitStation.bind(this));
    
    // toggle submit button activity on Valid URL input
    em.add(this._inputElement, 'input', this._toggleButtonActivity.bind(this));
  }

  /**
   * gets add stream button
   * 
   * @returns {HTMLElement} add stream button
   */
  get _addButton() {
    return document.querySelector(selectors.add);
  }

  /**
   * gets station submit form
   * 
   * @returns {HTMLElement} station submit form
   */
  get _stationSubmitForm() {
    return document.querySelector(selectors.stationSubmitForm);
  }

  /**
   * gets station URL input element
   * 
   * @returns {HTMLElement} station URL input element
   */
  get _inputElement() {
    return document.querySelector(selectors.stationUrl);
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
  async _submitStation(ev, retryCount = 0) {
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
        if (retryCount < MAX_CSRF_RETRIES) {
          const success = await updateCsrf();
          if (success) await this._submitStation(ev, retryCount + 1);
        } else {
          responseElement.textContent = 'Authentication error. Please try again.';
        }
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
    document.querySelectorAll('dialog').forEach(dialog => em.add(dialog, 'click', this._wobbleDialog.bind(this)));
    
    // X closes dialogs
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
 * shows a greeting dialog to the user, removes it if they have seen it before
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
  em.add(greetingElement, 'transitionend', () => {
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