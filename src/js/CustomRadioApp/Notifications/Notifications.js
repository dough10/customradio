import { t } from '../utils/i18n.js';

export default class Notifications {

  requestPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }
  

  _notify(title, body = '', icon = '/android-chrome-192x192.png', timeout = 5000) {
    if (Notification.permission !== 'granted') return;
  
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      silent: false,
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
  

  nowPlaying(name) {
    this._notify(t('playing', name));
  }
}