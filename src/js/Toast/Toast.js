import sleep from '../utils/sleep.js';
import isValidURL from '../utils/URL.js';
import ToastCache from './ToastCache.js';

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
    this.removeToast = this._removeToast.bind(this);

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
    sleep(25).then(() => requestAnimationFrame(() => {
      this.toast.toggleAttribute('opened');
      // console.log(`Toast displayed: ${message}`);
    }));
  }

  /**
   * Returns a new toast HTML element.
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
    return toast;
  }

  /**
   * Creates a toast with a clickable link.
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
   */
  _clicked() {
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
   * Plays the closing animation and removes the element from the document.
   */
  _removeToast() {
    clearTimeout(this._timer);
    if (!this.toast) return;
    const remove = () => {
      this.toast.removeEventListener('transitionend', remove, true);
      this.toast.remove();
    };
    this.toast.removeEventListener('transitionend', this._transitionEnd, true);
    this.toast.removeEventListener('click', this._clicked, true);
    this.toast.addEventListener('transitionend', remove, true);
    requestAnimationFrame(() => {
      this.toast.removeAttribute('opened');
    });
  }

  /**
   * Called after the opening animation ends.
   * Sets up a timer to close the toast after the specified timeout.
   */
  _transitionEnd() {
    if (!this.toast) return;
    this.toast.removeEventListener('transitionend', this._transitionEnd, true);
    this._timer = setTimeout(this._removeToast, this._timeout);
  }
}
