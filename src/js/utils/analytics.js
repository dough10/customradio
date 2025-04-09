export default class Analytics {
  _alert = document.querySelector('#alert');
  _dismissButton = document.querySelector('.alert>.yellow-text');

  _isDismissed = Number(localStorage.getItem('dismissed'));

  constructor() {
    this._dismissAlert = this._dismissAlert.bind(this);
    this._removeAlert = this._removeAlert.bind(this);
    this._checkContainer = this._checkContainer.bind(this);

    this._dismissButton.addEventListener('click', this._dismissAlert, true);

    this._checkAnalytics = setInterval(this._checkContainer, 500);

    window.onerror = (message, url, lineNumber, columnNumber, error) => {
      this._report(message, url, lineNumber, columnNumber, error);
      return true;
    };
  }

  _checkContainer() {
    // element was already dismissed
    const hasChildren = document.querySelectorAll('#matomo-opt-out>*').length > 0;
    
    // element has yet to populate
    if (!hasChildren) return;

    if (this._isDismissed) {
      this._dismissAlert();
      return;
    }

    // element is populate and ready open
    if (!this._alert.hasAttribute('open')) {
      clearInterval(this._checkAnalytics);
      this._alert.toggleAttribute('open');
    }
  }
  
  /**
   * remove the alert element from the DOM
   */
  _removeAlert() {
    this._alert.removeEventListener('transitionend', this._removeAlert, true);
    if (document.body.contains(this._alert)) {
      this._alert.remove(); 
      this._alert = null;
    }
  }

  /**
   * Animate alert element off screen
   * 
   * @param {Event} ev 
   */
  _dismissAlert(ev) { 
    // Mark the alert as dismissed in localStorage
    if (ev) localStorage.setItem('dismissed', '1');
  
    this._dismissButton.removeEventListener('click', this._dismissAlert, true);
  
    // Clear the interval for analytics checking
    clearInterval(this._checkAnalytics);
    this._checkAnalytics = null;
  
    // Add a transitionend listener to clean up the alert element after animation
    this._alert.addEventListener('transitionend', this._removeAlert, true);
  
    // Trigger the closing animation by removing the `open` attribute
    if (!this._alert.hasAttribute('open')) {
      this._removeAlert();
      return;
    }

    this._alert.removeAttribute('open');
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

  destroy() {
    // Remove event listener from the dismiss button
    if (this._dismissButton) {
      this._dismissButton.removeEventListener('click', this._dismissAlert, true);
    }

    // Clear the interval for analytics checking
    if (this._checkAnalytics) {
      clearInterval(this._checkAnalytics);
      this._checkAnalytics = null;
    }

    // Remove the alert element if it exists
    if (this._alert) {
      this._alert.removeEventListener('transitionend', this._removeAlert, true);
      if (document.body.contains(this._alert)) {
        this._alert.remove();
      }
      this._alert = null;
    }
  }
}