import EventManager from "../../utils/EventManager/EventManager";

export default class Analytics {
  _isDismissed = Number(localStorage.getItem('dismissed'));

  _em = new EventManager();

  /**
   * functions controling #alert element and matomo
   */
  constructor() {
    this._dismissAlert = this._dismissAlert.bind(this);
    this._removeAlert = this._removeAlert.bind(this);
    this._checkContainer = this._checkContainer.bind(this);

    this._checkAnalytics = setInterval(this._checkContainer, 500);
    
    this._windowError = this._windowError.bind(this);
    
    this._em.add(this._dismissButton, 'click', this._dismissAlert, true, 'dismissAlert');
    this._em.add(window, 'error', this._windowError, true);
  }

  get _alert() {
    return document.querySelector('#alert');
  }

  get _dismissButton() {
    return document.querySelector('.alert>.yellow-text');
  }

  /**
   * Handles window error events and reports them to Matomo.
   * @private
   * @method _windowError
   * 
   * @param {String} message 
   * @param {String} url 
   * @param {Number} lineNumber 
   * @param {Number} columnNumber 
   * @param {String} error 
   * 
   * @returns {Boolean}
   */
  _windowError(message, url, lineNumber, columnNumber, error) {
    this._report(message, url, lineNumber, columnNumber, error);
    return true;
  }

  /**
   * Destroys the Analytics instance, removing event listeners and clearing intervals.
   * This method should be called when the instance is no longer needed to prevent memory leaks.
   * 
   * @public
   * 
   * @method destroy
   * 
   * @returns {void}
   * 
   * @example
   * const analytics = new Analytics();
   * // ... use the analytics instance ...
   * analytics.destroy(); // Call this when done to clean up
   * @throws {Error} If there is an issue during the cleanup process, such as if the alert element cannot be removed.
   */
  destroy() {
    this._em.removeAll();

    if (this._checkAnalytics) {
      clearInterval(this._checkAnalytics);
      this._checkAnalytics = null;
    }

    const alert = this._alert;

    if (alert) {
      if (document.body.contains(alert)) {
        alert.remove();
      }
    }
  }

  /**
   * 
   * @private
   * @method _checkContainer
   * 
   * @returns {void}
   */
  _checkContainer() {
    const hasChildren = document.querySelectorAll('#matomo-opt-out>*').length > 0;
    const alert = this._alert;
    
    // element has yet to populate
    if (!hasChildren) return;
    
    // element was already dismissed
    if (this._isDismissed) {
      this._dismissAlert();
      return;
    }

    // element is populate and ready open
    if (!alert.hasAttribute('open')) {
      clearInterval(this._checkAnalytics);
      alert.toggleAttribute('open');
    }
  }
  
  /**
   * remove the alert element from the DOM
   */
  _removeAlert() {
    const alert = this._alert;
    this._em.remove(this._alertTransition);
    if (document.body.contains(alert)) {
      alert.remove(); 
    }
  }

  /**
   * Animate alert element off screen
   * 
   * @param {Event} ev 
   */
  _dismissAlert(ev) { 
    const alert = this._alert;

    // Mark the alert as dismissed in localStorage
    if (ev) localStorage.setItem('dismissed', '1');
  
    this._em.removeByNamespace('dismissAlert');
  
    // Clear the interval for analytics checking
    clearInterval(this._checkAnalytics);
    this._checkAnalytics = null;
  
    // Add a transitionend listener to clean up the alert element after animation
    this._alertTransition = this._em.add(alert, 'transitionend', this._removeAlert, true);
  
    // Trigger the closing animation by removing the `open` attribute
    if (!alert.hasAttribute('open')) {
      this._removeAlert();
      return;
    }

    alert.removeAttribute('open');
  }

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
  _report(message, url, lineNumber, columnNumber, error) {
    var errorMessage = `Error: ${message} at ${url}:${lineNumber}:${columnNumber}`;
    if (typeof _paq !== 'undefined') _paq.push(['JavaScript Error', errorMessage || '']);
  }
}