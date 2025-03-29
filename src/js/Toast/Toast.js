import sleep from '../utils/sleep.js';
import { isValidURL } from '../utils/URL.js';

const CACHE_CHECK_INTERVAL = 500;

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
  static _toastCache = [];
  static _cacheWatcher = null;
  _timer = null;
  
  constructor(message, _timeout = 3.5, link, linkText) {
    // push toast to cache if currently displaying a toast
    if (document.querySelector('#toast')) {
      Toast._addToCache(message, _timeout, link, linkText);
      return;
    }
    // bind this to internal functions
    this._transitionEnd = this._transitionEnd.bind(this);
    this._cleanUp = this._removeToast.bind(this);
    this._clicked = this._clicked.bind(this);

    this._timeout = _timeout * 1000;
    this.toast = this._createToast();
    if (link && linkText) {
      this.toast.append(this._createToastWithLink(message, link, linkText));
    } else {
      this.toast.textContent = message;
    }
    document.querySelector('body').append(this.toast);
    sleep(25).then(_ => requestAnimationFrame(_ => {
      this.toast.toggleAttribute('opened');
    }));
  }

  /**
   * returns a new toast html element
   * 
   * @returns {HTMLElement} hot toast
   */
  _createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.classList.add('toast');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.addEventListener('transitionend', this._transitionEnd, true);
    toast.addEventListener('click', this._clicked, true);
    return toast;
  }

  /**
   * Creates a toast with a clickable link.
   * If the link is invalid, only the message is displayed.
   * 
   * @param {String} message - The message to display in the toast.
   * @param {String} link - The URL or function to execute when the toast is clicked.
   * @param {String} linkText - The text to display for the link.
   * 
   * @returns {HTMLElement} The toast element with the link.
   */
  _createToastWithLink(message, link, linkText) {
    const mText = document.createElement('div');
    mText.textContent = message;
    
    if (typeof link === 'string' && !isValidURL(link)) {
      return mText;
    }
    
    const lText = document.createElement('div');
    lText.textContent = linkText;
    lText.classList.add('yellow-text');

    const wrapper = document.createElement('div');
    wrapper.classList.add('toast-wrapper');
    wrapper.setAttribute('role', 'link');
    wrapper.setAttribute('aria-label', `Link: ${linkText}`);
    wrapper.append(mText, lText);

    this.link = link;

    return wrapper;
  }

  /**
   * Handles click events on the toast.
   * Opens the link in a new tab if valid, executes the function if provided, or logs an error if invalid.
   */
  _clicked(e) {
    if (this.link && typeof this.link === 'string' && isValidURL(this.link)) {
      window.open(this.link, "_blank");
    } else if (this.link && typeof this.link === 'function') {
      this.link();
    } else if (this.link) {
      console.error(`Invalid "link" parameter in Toast. Message: "${this.toast.textContent}", Link: "${this.link}", Type: ${typeof this.link}`);
    }
    this._removeToast();
  }

  /**
   * play closing animation and remove element from document
   */
  _removeToast() {
    clearTimeout(this._timer);
    this._timer = null;
    if (!this.toast) return;
    this.toast.removeEventListener('transitionend', this._transitionEnd);
    this.toast.removeEventListener('click', this._clicked);
    this.toast.addEventListener('transitionend', () => {
      if (this.toast) this.toast.remove();
    });
    requestAnimationFrame(() => {
      this.toast.removeAttribute('opened');
    });
  }

  /**
   * called after opening animation
   * sets up closing animation
   */
  _transitionEnd() {
    this._timer = setTimeout(this._removeToast, this._timeout);
    this.toast.removeEventListener('transitionend', this._transitionEnd);
  }

  /**
   * Adds a toast message to the cache and starts the cache watcher if not already running.
   * 
   * @param {String} message - The message to display in the toast.
   * @param {Number} timeout - The timeout duration for the toast.
   * @param {String|Function} link - The URL or function to execute when the toast is clicked.
   * @param {String} linkText - The text to display for the link.
   */
  static _addToCache(message, timeout, link, linkText) {
    Toast._toastCache.push([message, timeout, link, linkText]);
    if (!Toast._cacheWatcher) {
      Toast._cacheWatcher = setInterval(() => {
        if (!Toast._toastCache.length || document.querySelector('#toast')) {
          return;
        }
        const [msg, t, l, lt] = Toast._toastCache.shift();
        new Toast(msg, t, l, lt);
        if (!Toast._toastCache.length) {
          clearInterval(Toast._cacheWatcher);
          Toast._cacheWatcher = null;
        }
      }, CACHE_CHECK_INTERVAL);
    }
  }
}
