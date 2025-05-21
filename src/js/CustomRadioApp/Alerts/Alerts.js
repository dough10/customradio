import EventManager from '../utils/EventManager/EventManager';
import sleep from '../utils/sleep'
import { t } from '../utils/i18n';


export default class Alert {
  #em = new EventManager();
  constructor(bodyHTML) {
    this.alert = this.#createAlert(bodyHTML);
    document.querySelector('body').append(this.alert);
    sleep(10).then(_ => requestAnimationFrame(() => this.alert.setAttribute('open', true)));
  }

  destroy() {
    if (!this.alert) return;
    this.#em.add(this.alert, 'transitionend', _ => {
      this.alert.remove();
      this.#em.removeByNamespace('alert-click');
      this.#em.removeByNamespace('close-animation');
      this.alert = null;
    }, true, 'close-animation');
    this.alert.removeAttribute('open');
  }

  #createAlert(bodyHTML) {    
    const dismiss = document.createElement('div');
    dismiss.classList.add('yellow-text');
    dismiss.textContent = t('dismiss');
    dismiss.setAttribute('role', 'button');
    dismiss.setAttribute('aria-label', t('dismiss_alert'));
    this.#em.add(dismiss, 'click', this.destroy.bind(this), true, 'alert-click');

    const alertBody = document.createElement('div');
    alertBody.innerHTML = bodyHTML;

    const alert = document.createElement('div');
    alert.id = 'alert';
    alert.classList.add('alert');
    alert.append(alertBody, dismiss);
    return alert;
  }
}