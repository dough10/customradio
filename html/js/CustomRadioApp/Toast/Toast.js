import EventManager from '../EventManager/EventManager.js';
import isValidURL from '../utils/URL.js';
import hapticFeedback from '../utils/hapticFeedback.js';
import ToastCache from './ToastCache.js';
import sleep from '../utils/sleep.js';

const NAMESPACES = {
  OPEN_ANIMATION: 'open-animation',
  CLOSE_ANIMATION: 'close-animation',
  USER_INTERACTIONS: 'user-interactions',
};

/**
 * text link used in toast
 * 
 * @param {String} link 
 * 
 * @param {String} textContent 
 */
function webLink(link, textContent) {
  if (isValidURL(link)) {
    window.open(link, "_blank");
  } else {
    console.error(`Invalid URL in Toast. Message: "${textContent}", Link: "${link}"`);
  }
}

/**
 * function call for toast link
 * 
 * @param {Function} link 
 * 
 * @param {String} textContent 
 */
function linkIsFunction(link, textContent) {
  try {
    link();
  } catch (error) {
    console.error(`Error executing link function in Toast. Message: "${textContent}", Error: ${error.message}`);
  }
}

/**
 * Toast class for displaying temporary messages to the user.
 * The toast can contain a message and an optional clickable link.
 * If a toast is already displayed, new toasts are cached and displayed in order.
 * The toast will automatically close after a specified timeout.
 *
 * @class
 * @param {String} message - The message to display in the toast.
 * @param {Number} _timeout - The timeout duration for the toast (in seconds).
 * @param {String|Function} link - The URL or function to execute when the toast is clicked.
 * @param {String} linkText - The text to display for the link.
 */
export default class Toast {
  constructor(message, _timeout = 3.5, link, linkText) {
    if (document.querySelector('#toast')) {
      ToastCache.addToCache(message, _timeout, link, linkText, (msg, t, l, lt) => new Toast(msg, t, l, lt));
      return;
    }

    // set the timeout duration in milliseconds
    this._timeout = _timeout * 1000;
    this._em = new EventManager();

    // message container
    this.toast = this._createToast();

    this.link = link;

    // add content
    if (link && linkText) {
      this.toast.append(this._createLink(message, link, linkText));
    } else {
      this.toast.textContent = message;
    }

    // append to the document body
    document.querySelector('body').append(this.toast);
    
    //display the toast
    sleep(25).then(() => requestAnimationFrame(() => {
      if (!this.toast) throw new Error(`Failed to create toast with message: ${message}`);
      this.toast.toggleAttribute('opened');
    }));

  }

  /**
   * Returns a new toast HTML element.
   * 
   * @private
   * @function
   * 
   * @returns {HTMLElement} The toast element.
   */
  _createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.classList.add('toast');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const listeners = [
      { 
        type: this._em.types.transitionend, 
        handler: _ => this._transitionEnd(), 
        options: true, 
        namespace: NAMESPACES.OPEN_ANIMATION 
      }, { 
        type: this._em.types.click, 
        handler: _ => this._clicked(), 
        options: true, 
        namespace: NAMESPACES.USER_INTERACTIONS 
      }, { 
        type: this._em.types.mouseenter,
        handler: _ => this._mouseIn(), 
        options: true, 
        namespace: NAMESPACES.USER_INTERACTIONS 
      }, { 
        type: this._em.types.mouseleave, 
        handler: _ => this._mouseOut(), 
        options: true, 
        namespace: NAMESPACES.USER_INTERACTIONS 
      },
    ];

    for (const { type, handler, options, namespace } of listeners) {
      if (this._em.add(toast, type, handler, options, namespace) < 0) {
        console.warn(`Failed to add ${type} listener for ${namespace}`);
      }
    }

    return toast;
  }

  /**
   * stop timer when mouse enters toast element
   * 
   * @private
   * @function
   */
  _mouseIn() {
    if (!this._timer) return;
    clearTimeout(this._timer);
    this._timer = null;
    this._remainingTime = this._timeout - (Date.now() - this._startTime);
  }

  /**
   * resumes timer when mouse leaves the toast element
   * 
   * @private
   * @function
   */
  _mouseOut() {
    if (this._timer || !this._remainingTime) return;
    this._startTime = Date.now();
    this._timer = setTimeout(_ => this._cleanupToast(), this._remainingTime);
  }

  /**
   * Creates a toast with a clickable link.
   * 
   * @private
   * @function
   * 
   * @param {String} message - The message to display in the toast.
   * @param {String} link - The URL or function to execute when the toast is clicked.
   * @param {String} linkText - The text to display for the link.
   * 
   * @returns {HTMLElement} The toast element with the link.
   */
  _createLink(message, link, linkText) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('toast-wrapper');

    const mText = document.createElement('div');
    mText.textContent = message;

    if (typeof link === 'string' && !isValidURL(link)) {
      wrapper.append(mText);
      return wrapper;
    }

    const lText = document.createElement('div');
    lText.textContent = linkText;
    lText.classList.add('yellow-text');

    wrapper.setAttribute('role', 'link');
    wrapper.setAttribute('aria-label', `Link: ${linkText}`);
    wrapper.append(mText, lText);

    return wrapper;
  }

  /**
   * Handles click events on the toast.
   * 
   * @private
   * @function
   */
  _clicked() {
    hapticFeedback();
    if (!this.link) {
      this._cleanupToast();
      return;
    }

    const linkType = typeof this.link;
    const textContent = this.toast.textContent;

    if (linkType === 'string') {
      webLink(this.link, textContent);
    } else if (linkType === 'function') {
      linkIsFunction(this.link, textContent);
    } else {
      console.error(`Invalid "link" parameter in Toast. Message: "${textContent}", Link: "${this.link}", Type: ${linkType}`);
    }

    this._cleanupToast();
  }

  /**
   * Plays the closing animation and removes the element from the document.
   * 
   * @private
   * @function
   */
  _cleanupToast() {
    clearTimeout(this._timer);
    this._timer = 0;
    
    // debug
    if (!this.toast) throw new Error(`Toast element disappeared`);

    // clean up listeners added when the toast element was created
    this._em.removeByNamespace(NAMESPACES.USER_INTERACTIONS);
    this._em.removeByNamespace(NAMESPACES.OPEN_ANIMATION);

    // attach listener for closing transition
    // element will be deleted after
    if (this._em.add(this.toast, this._em.types.transitionend, ev => this._removeToast(ev), true, NAMESPACES.CLOSE_ANIMATION) < 0) {
      console.warn(`Failed to add transitionend listener for closing animation`);
    }
    requestAnimationFrame(() => {
      this.toast.removeAttribute('opened');
    });
  }

  /**
   * remove from DOM and clean up last listener
   * 
   * @private
   * @function
   */
  _removeToast() {
    this._em.removeAll();
    this.toast.remove();
  }

  /**
   * Called after the opening animation ends.
   * Sets up a timer to close the toast after the specified timeout.
   * 
   * @private
   * @function
   */
  _transitionEnd() {
    // debug
    if (!this.toast) throw new Error(`Toast element disappeared in opening animation`);

    // remove opening transition listener
    this._em.removeByNamespace(NAMESPACES.OPEN_ANIMATION);

    // set starttime for mouse in / out behavor
    this._startTime = Date.now();
    this._timer = setTimeout(_ => this._cleanupToast(), this._timeout);
  }
}

window.Toast = Toast;
