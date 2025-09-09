import Alert from '../Alerts/Alerts.js';
import { t } from './i18n.js';

export default function news() {
  const time = 2500;
  const lsKey = 'loginNews';

  if (localStorage.getItem(lsKey)) return;

  if (document.querySelector('#alert')) {
    return setTimeout(news, time);
  }

  setTimeout(_ => {
    new Alert(t('news'), lsKey);
  }, time);
}