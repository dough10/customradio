import { t } from '../utils/i18n.js';

export default class Notifications {
  /**
   * Requests notification permission from the user.
   */
  requestPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  /**
   * Sends a notification using the appropriate API (Notification API or Service Worker API).
   * 
   * @param {string} title - The title of the notification.
   * @param {string} [body=''] - The body text of the notification.
   * @param {string} [icon='/android-chrome-192x192.png'] - The icon for the notification.
   * @param {number} [timeout=5000] - The duration (in ms) before the notification is automatically closed.
   * @param {boolean} [silent=true] - Whether the notification should be silent (no sound).
   */
  async _notify(title, body = '', icon = '/android-chrome-192x192.png', timeout = 5000, silent = true) {
    if (Notification.permission !== 'granted') return;

    // Use Service Worker API if available
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          silent,
          tag: 'custom-radio-notification',
          renotify: true
        });

        // Optionally close the notification after a timeout
        if (timeout > 0) {
          setTimeout(async () => {
            const notifications = await registration.getNotifications({ tag: 'custom-radio-notification' });
            notifications.forEach(notification => notification.close());
          }, timeout);
        }
        return;
      }
    }

    // Fallback to Notification API if Service Worker API is not available
    if ('Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        silent,
        tag: 'custom-radio-notification',
        renotify: true
      });

      notification.onclick = () => {
        window.focus();
      };

      if (timeout > 0) {
        setTimeout(() => notification.close(), timeout);
      }
    }
  }

  /**
   * Sends a "Now Playing" notification.
   * 
   * @param {string} name - The name of the currently playing station.
   */
  nowPlaying(name) {
    this._notify(t('playing', name));
  }
}