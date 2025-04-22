const CACHE_CHECK_INTERVAL = 500;

/**
 * ToastCache is a utility class that manages a cache of toast messages.
 * It allows for adding toasts to a queue and ensures they are displayed in order
 * when there is no other toast currently displayed. This prevents multiple
 * toasts from being displayed at the same time and ensures a smooth user experience.
 */
class ToastCache {
  constructor() {
    this._toastCache = [];
    this._cacheWatcher = null;
  }

  /**
   * Adds a toast message to the cache and starts the cache watcher if not already running.
   * 
   * @public
   * @function
   * 
   * @param {String} message - The message to display in the toast.
   * @param {Number} timeout - The timeout duration for the toast.
   * @param {String|Function} link - The URL or function to execute when the toast is clicked.
   * @param {String} linkText - The text to display for the link.
   * @param {Function} createToast - A callback to create a new toast.
   */
  addToCache(message, timeout, link, linkText, createToast) {
    // add toast to cache
    this._toastCache.push([message, timeout, link, linkText]);

    // start the cache watcher if not already running
    if (this._cacheWatcher) return;
    this._cacheWatcher = setInterval(() => {
      // if a toast is already displayed, do nothing
      if (document.querySelector('#toast')) return;

      // create and display the next toast in the cache
      const [msg, t, l, lt] = this._toastCache.shift();
      createToast(msg, t, l, lt);

      // if the cache is empty after removing the toast, stop the watcher
      if (!this._toastCache.length) {
        clearInterval(this._cacheWatcher);
        this._cacheWatcher = null;
      }
    }, CACHE_CHECK_INTERVAL);
  }
}

export default new ToastCache();