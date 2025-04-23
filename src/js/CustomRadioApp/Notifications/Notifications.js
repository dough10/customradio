import { t } from '../utils/i18n.js';

export default class Notifications {
  /**
   * Requests notification permission from the user.
   *
   * @public
   * @returns {Promise<void>}
   */
  requestPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  /**
   * Sends a notification using the Notification API or Service Worker API.
   *
   * @private
   * @param {string} title - The title of the notification.
   * @param {string} [body=''] - The body text of the notification.
   * @param {string} [icon='/android-chrome-192x192.png'] - The icon for the notification.
   * @param {number} [timeout=5000] - Duration in ms before auto-closing the notification.
   * @param {boolean} [silent=true] - Whether the notification should be silent.
   */
  async _notify(title, body = '', icon = '/android-chrome-192x192.png', timeout = 5000, silent = true) {
    if (Notification.permission !== 'granted') return;

    const options = {
      body,
      icon,
      badge: icon,
      silent,
      tag: 'custom-radio-notification',
      renotify: true,
    };

    // Prefer Service Worker API
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification(title, options);

        if (timeout > 0) {
          setTimeout(async () => {
            const notifications = await registration.getNotifications({ tag: options.tag });
            notifications.forEach(n => n.close());
          }, timeout);
        }

        return;
      }
    }

    // Fallback to basic Notification API
    if ('Notification' in window) {
      const notification = new Notification(title, options);
      notification.onclick = () => window.focus();

      if (timeout > 0) {
        setTimeout(() => notification.close(), timeout);
      }
    }
  }

  /**
   * Sends a "Now Playing" notification.
   *
   * @public
   * @param {string} name - The name of the currently playing station.
   */
  nowPlaying(name) {
    this._notify(t('playing', name));
  }
}
