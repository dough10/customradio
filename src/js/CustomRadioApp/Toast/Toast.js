import isValidURL from '../utils/URL.js';
import hapticFeedback from '../utils/hapticFeedback.js';
import ToastCache from './ToastCache.js';

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
    
    //bind this
    this._transitionEnd = this._transitionEnd.bind(this);
    this._clicked = this._clicked.bind(this);
    this._cleanupToast = this._cleanupToast.bind(this);
    this._mouseIn = this._mouseIn.bind(this);
    this._mouseOut = this._mouseOut.bind(this);
    this._removeToast = this._removeToast.bind(this);

    // set the timeout duration in milliseconds
    this._timeout = _timeout * 1000;

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
    requestAnimationFrame(() => {
      if (!this.toast) throw new Error(`Failed to create toast with message: ${message}`);
      this.toast.toggleAttribute('opened');
      console.log(message);
    });
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
    toast.addEventListener('transitionend', this._transitionEnd, true);
    toast.addEventListener('click', this._clicked, true);
    toast.addEventListener('mouseenter', this._mouseIn, true);
    toast.addEventListener('mouseleave', this._mouseOut, true);
    return toast;
  }

  /**
   * stop timer when mouse enters toast element
   * 
   * @private
   * @function
   */
  _mouseIn() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
      this._remainingTime = this._timeout - (Date.now() - this._startTime);
    }
  }

  /**
   * resumes timer when mouse leaves the toast element
   * 
   * @private
   * @function
   */
  _mouseOut() {
    if (this._remainingTime > 0) {
      this._startTime = Date.now();
      this._timer = setTimeout(this._cleanupToast, this._remainingTime);
    }
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
    const mText = document.createElement('div');
    mText.textContent = message;

    if (typeof link === 'string' && !isValidURL(link)) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('toast-wrapper');
      wrapper.append(mText);
      return wrapper;
    }

    const lText = document.createElement('div');
    lText.textContent = linkText;
    lText.classList.add('yellow-text');

    const wrapper = document.createElement('div');
    wrapper.classList.add('toast-wrapper');
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

    if (typeof this.link === 'string') {
      webLink(this.link, this.toast.textContent);

    } else if (typeof this.link === 'function') {
      linkIsFunction(this.link, this.toast.textContent);

    } else {
      console.error(`Invalid "link" parameter in Toast. Message: "${this.toast.textContent}", Link: "${this.link}", Type: ${typeof this.link}`);
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
    if (!this.toast) throw new Error(`Toast element disapeared`);

    // clean up listeners added when creating the toast element
    this.toast.removeEventListener('transitionend', this._transitionEnd, true);
    this.toast.removeEventListener('click', this._clicked, true);
    this.toast.removeEventListener('mouseenter', this._mouseIn, true);
    this.toast.removeEventListener('mouseleave', this._mouseOut, true);

    // attach listener for closing transition
    // element will be deleted after
    this.toast.addEventListener('transitionend', this._removeToast, true);
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
    this.toast.removeEventListener('transitionend', this._removeToast, true);
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
    if (!this.toast) throw new Error(`Toast element disapeared in opening animation`);

    // remove opening transition listener
    this.toast.removeEventListener('transitionend', this._transitionEnd, true);

    // set starttime for mouse in / out behavor
    this._startTime = Date.now();
    this._timer = setTimeout(this._cleanupToast, this._timeout);
  }
}
