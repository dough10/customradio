import Alert from '../Alerts/Alerts.js';

export default function news() {
  const newURL = 'https://radiotxt.site';
  const currentURL = 'https://customradio.dough10.me';
  const time = 2500;
  const lsKey = 'newUrlTransitionAlertShown';

  if (window.location.origin === newURL) return;
  if (localStorage.getItem(lsKey)) return;

  if (document.querySelector('#alert')) {
    return setTimeout(news, time);
  }

  setTimeout(_ => {
    localStorage.setItem(lsKey, 1);
    new Alert(t('moving', newURL, currentURL));
  }, time);
}